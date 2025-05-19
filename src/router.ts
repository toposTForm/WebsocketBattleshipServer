import Websocket, { WebSocketServer } from 'ws';
import { UUID } from 'node:crypto';
import { ReqReg, ReqCreateRoom } from './reqTypes';
import { ResReg, ResUpdateWinners, ResAddUserToRoom, ResUpdateRoom } from './resTypes'; 
import { WSmain, testWs, newGame } from './server';
import { error } from 'node:console';
import { Game } from './game';

export function router(ws: any, message: ReqReg | ReqCreateRoom){
    switch (message.type) {
        case 'reg':
            let clientUUID = crypto.randomUUID();
            try {
                let name: string = JSON.parse(message.data.toString()).name;
                let password: string = JSON.parse(message.data.toString()).password;
                if (WSmain.clientList.length == 0){
                    WSmain.pushClientToList({websocket: ws, username: name, password: password, clientID: clientUUID});
                } 
                
                let findIfUserAlreadyRegistered = WSmain.clientList.find((user) => user.username == name);
                if (!findIfUserAlreadyRegistered){
                    WSmain.pushClientToList({websocket: ws, username: name, password: password, clientID: clientUUID});
                }
                let data: ResReg = {
                    type: 'reg',
                        data: {
                            name: name,
                            index: clientUUID,
                            error: false,
                            errorText: 'noError',
                        },
                    id: 0,
                };
                data.data = JSON.stringify(data.data);
                testWs.wsSentMessageToClient(ws, data);
                let gamers = WSmain.clientList.map((gamer) => ({
                    name:  gamer.username,
                    index: gamer.clientID,
                }));
                let rooms: {roomId: number, roomUsers: {}[]}[] = 
                    Game.availableRoomList.map((room) => ({
                    roomId: room.number,
                    roomUsers: gamers
                    })); 
                let upData: ResUpdateRoom = {
                    type: 'update_room',
                    data: JSON.stringify(rooms),
                    id: 0,
                } 
                testWs.wsSentMessageToClient(ws, upData);
            } catch (error) {
                console.error(error);
            }
            console.log(WSmain.clientList);
            break;
        case 'create_room': {
            let roomData: any = WSmain.clientList.find((user) => {
                if (user.websocket == ws) return ({
                    name: user.username,
                    clientID: user.clientID
                } )
            });
            newGame.createRoom(ws, roomData.name, roomData.clientID);
            let gamers = WSmain.clientList.map((gamer) => ({
                name:  gamer.username,
                index: gamer.clientID,
            }));
            let rooms: {roomId: number, roomUsers: {}[]}[] = 
                 Game.availableRoomList.map((room) => ({
                roomId: room.number,
                roomUsers: gamers
                })); 
            let data: ResUpdateRoom = {
                type: 'update_room',
                data: JSON.stringify(rooms),
                id: 0,
            } 
            testWs.wsSentMessageToClient(ws, data);
        };
            break;
        default:
            break;
    }
    
  
}