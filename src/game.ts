import { KeyObject } from "node:crypto";
import { WSmain, testWs } from "./server";
import { ResUpdateRoom } from "./resTypes";  
import Websocket, { WebSocketServer } from 'ws';

export class Game  {
    static availableRoomList: Array<{number: number, available: boolean, gamersInside: Array<{socket: Websocket, username: string, clientID: string}>}> = [

    ]
    public createRoom(ws: Websocket, username: string, clientID: string){
        let gamers = [];
        gamers.push({
            socket: ws,
            username: username,
            clientID: clientID
        });
        let newRoom = Game.availableRoomList.push({
            number: Game.availableRoomList.length,
            available: true,
            gamersInside: gamers
        });
        return newRoom;
    }
    public getAvailRoom(){
        let freeRoom = Game.availableRoomList.find((room) => room.available == true);
        return freeRoom;
    }
    public updateRoom(ws: Websocket){
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
    }
    
    };
    
