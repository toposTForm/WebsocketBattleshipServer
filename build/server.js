"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newGame = exports.testWs = exports.WSmain = void 0;
const ws_1 = require("ws");
const router_1 = require("./router");
const game_1 = require("./game");
const defaultPort = 3000;
class WSmain {
    constructor(port) {
        this.port = port;
    }
    addWs() {
        const wss = new ws_1.WebSocketServer({ port: this.port });
        this.wsConsoleParams(wss);
        wss.on('connection', (ws, req) => {
            const clientIp = req.socket.remoteAddress;
            const clientUrl = req.url;
            console.log(`Client with IP ${clientIp}; URL: ${clientUrl} connected!`);
            ws.on('error', error => this.wsError(error));
            ws.on('message', (message) => {
                let messagetoJSON;
                try {
                    messagetoJSON = JSON.parse(message.toString());
                    (0, router_1.router)(ws, messagetoJSON);
                }
                catch (error) {
                    console.error(error);
                }
            });
            ws.on('close', () => {
                let indexOfclient = WSmain.clientList.findIndex((client) => client.websocket == ws);
                WSmain.clientList.splice(indexOfclient, 1);
            });
            process.on('SIGINT', () => {
                for (const client of WSmain.clientList)
                    client.websocket.close(1000, 'Server shutdown');
                process.exit(0);
            });
        });
        return wss;
    }
    wsError(error) {
        console.error(error);
    }
    wsConsoleParams(wss) {
        let port = this.port;
        let socket = wss;
    }
    wsSentMessageToClient(ws, message) {
        ws.send(JSON.stringify(message));
    }
    static pushClientToList(client) {
        this.clientList.push(client);
    }
}
exports.WSmain = WSmain;
WSmain.clientList = [];
exports.testWs = new WSmain(defaultPort);
exports.testWs.addWs();
exports.newGame = new game_1.Game();
//# sourceMappingURL=server.js.map