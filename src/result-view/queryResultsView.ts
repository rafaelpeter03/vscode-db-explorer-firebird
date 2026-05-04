import { WebviewPanel, window, ViewColumn, Disposable, Uri, WebviewPanelOptions, WebviewOptions } from "vscode";
import { EventEmitter } from "events";
import { dirname, join } from "path";
import { readFile } from "fs";
import { logger } from "../logger/logger";

export interface Message {
  command: string;
  data: object;
  id?: string;
}

export class QueryResultsView extends EventEmitter implements Disposable {
  private disposable?: Disposable;

  private resourcesPath: string;
  protected panel: WebviewPanel | undefined;
  private htmlCache: { [path: string]: string };
  constructor(private type: string, private title: string) {
    super();
    this.resourcesPath = "";
    this.htmlCache = {};
  }

  show(htmlPath: string) {
    this.resourcesPath = dirname(htmlPath);
    if (!this.panel) {
      this.init();
    } else {
      this.panel.reveal(ViewColumn.Two, false);
    }

    this.readFile(htmlPath, (html: string) => {
      if (this.panel) {
        // Since we are using vite-plugin-singlefile, there are no external relative uris to replace.
        // We just serve the single html file directly.
        this.panel.webview.html = html;
      }
    });
  }

  private init() {
    const subscriptions = [];

    const options: WebviewPanelOptions & WebviewOptions = {
      enableScripts: true,
      retainContextWhenHidden: false,
      localResourceRoots: [Uri.file(this.resourcesPath)]
    };

    this.panel = window.createWebviewPanel(this.type, this.title, ViewColumn.Two, options);
    subscriptions.push(this.panel);

    subscriptions.push(this.panel.onDidDispose(() => this.dispose()));

    subscriptions.push(
      this.panel.webview.onDidReceiveMessage((message: Message) => {
        logger.debug(`Received command from webview | Command: ${message.command}`);
        this.handleMessage(message);
      })
    );

    this.disposable = Disposable.from(...subscriptions);
  }

  private readFile(path: string, callback: (html: string) => void) {
    // For local development it may be nice to read the file continuously,
    // but caching the file avoids reading it multiple times.
    readFile(path, "utf8", (_err, content) => {
      const html = content || "";
      this.htmlCache[path] = html;
      callback(html);
    });
  }

  send(message: Message) {
    if (this.panel) {
      this.panel.webview.postMessage(message);
      logger.info("Results displayed.");
    }
  }

  setTitle(title: string) {
    if (this.panel) {
      this.panel.title = title;
    }
  }

  randomString(length: number) {
    return Math.round(Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))
      .toString(36)
      .slice(1);
  }

  public handleMessage(message: Message) {
    logger.info("HANDLE MESSAGE CALLED");

    throw new Error("Method not implemented");
  }

  dispose() {
    if (this.disposable) {
      this.disposable.dispose();
    }
    this.panel = undefined;
  }
}
