import Websocket, { WebSocketServer } from 'ws';
import { ReqAttack, ReqReg } from './reqTypes';
import { ResReg, ResUpdateRoom, ResUpdateWinners, ResCreateGame, ResStartGame, ResTurn, ResFinish } from './resTypes';
import { router } from './router'
import { Game } from './game';

const defaultPort = 3000;

export class WSmain  {
    private port: number;
    constructor(port: number){
        this.port = port;
    }
    public addWs(){
        const wss = new WebSocketServer( { port: this.port});
        this.wsConsoleParams(wss);
        wss.on('connection', ( ws: Websocket, req ) => { 
            const clientIp = req.socket.remoteAddress;
            const clientUrl = req.url;
            console.log(`Client with IP ${clientIp}; URL: ${clientUrl} connected!`);
            ws.on('error', error => this.wsError(error));
            ws.on('message', (message) => {
                let messagetoJSON: ReqReg;
                try {
                    messagetoJSON = JSON.parse(message.toString());
                    router(ws, messagetoJSON);
                } catch (error) {
                    console.error(error);
                }  
            });
            ws.on('close', () => {
                let indexOfclient = WSmain.clientList.findIndex((client) => client.websocket == ws);
                WSmain.clientList.splice(indexOfclient, 1);
            });
            process.on('SIGINT', () => {
            for (const client of WSmain.clientList)
                client.websocket.close(1000, 'Server shutdown')
                process.exit(0);
            })
        });
        return wss;
    }
    private wsError(error: Error) {
        console.error(error);
    }
    private wsConsoleParams(wss: WebSocketServer){
        let port = this.port;
        let socket = wss;
    }
    public wsSentMessageToClient(ws: Websocket, message: ResReg | ResUpdateRoom | ResCreateGame | ResStartGame | ResTurn | ReqAttack | ResUpdateWinners | ResFinish){
        ws.send(JSON.stringify(message));
    }
    static clientList: Array<{ websocket: Websocket, username: string, password: string, clientID: string }> = [];
    static pushClientToList(client: { websocket: Websocket, username: string, password: string, clientID: string }){
        this.clientList.push(client);
    }
    
}

export const testWs = new WSmain(defaultPort);
testWs.addWs();
export const newGame = new Game();