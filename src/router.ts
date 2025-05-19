import Websocket from 'ws';
import { ReqReg, ReqCreateRoom, ReqAddUserToRoom, ReqAddShips, ReqAttack, ReqRandomAttack } from './reqTypes';
import { ResReg } from './resTypes'; 
import { WSmain, testWs, newGame } from './server';
import { Game } from './game';

export function router(ws: Websocket, message: ReqReg | ReqCreateRoom | ReqAddUserToRoom | ReqAddShips | ReqAttack | ReqRandomAttack){
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
                newGame.updateRoom();
                newGame.updateWinners();
                console.log(`Request | 'req' | name: ${name}, password: ${password}`);
                console.log(`Response | 'req' | name: ${name}, index: ${clientUUID}, error: ${false}, errorText: 'noError'`);
            } catch (error) {
                console.error(error);
                  let data: ResReg = {
                    type: 'reg',
                        data: {
                            name: 'not registered',
                            index: 'not registered',
                            error: true,
                            errorText: error as string,
                        },
                    id: 0,
                };
                testWs.wsSentMessageToClient(ws, data);
            }
            break;
        case 'create_room': {
            let roomData: any = WSmain.clientList.find((user) => {
                if (user.websocket == ws) return ({
                    username: user.username,
                    clientID: user.clientID
                } )
            });
            newGame.createRoom(ws, roomData.username, roomData.clientID);
            console.log(`Request | 'create_room' |`);
            newGame.updateRoom();
        };
            break;
        case 'add_user_to_room': {
            let indexRoom = JSON.parse(message.data.toString()).indexRoom;
            let roomData: any = WSmain.clientList.find((user) => {
                if (user.websocket == ws) return ({
                    name: user.username,
                    clientID: user.clientID
                })
            });
            console.log(`Request | 'add_user_to_room' | `);
            if (newGame.addUserToRoom(ws, indexRoom, roomData.username, roomData.clientID)){
                newGame.createGame(ws);
                newGame.updateRoom();
            };
        }   
            break;
        case 'add_ships': {
            try {
                let data = JSON.parse(message.data.toString());
                let gameId = data.gameId;
                let ships = data.ships
                let indexPlayer = data.indexPlayer;
                newGame.placeShipsOnBoard(ws, gameId, ships, indexPlayer);
                let gameBoardIndex = Game.gameBoard.findIndex((gamer) => gamer.gameId == gameId);
                if (Game.gameBoard[gameBoardIndex].gamersNeedInside.length == 2){
                    newGame.startGame(gameId);
                    newGame.turn(ws);
                } 
            } catch (error) {
                console.log(error)
            }
        }
            break;
        case 'attack': {
            let data = JSON.parse(message.data.toString());
            let attackRes = newGame.attack(ws, data);
            console.log(`Request | 'attack' | data: ${data}`);
            if (attackRes?.gameStatus !== 'finish'){
                newGame.turn(ws);
            }else {
                newGame.finish(attackRes.winner);
                newGame.updateWinners();
            }
        }
            break;
        case 'randomAttack': {
            let data = JSON.parse(message.data.toString());
            let randomX = Math.floor((Math.random() * 10));
            let randomY = Math.floor((Math.random() * 10));
            let newData = {
                gameId: data.gameId,
                x: randomX,
                y: randomY,
                indexPlayer: data.indexPlayer,
            };
            let attackRes = newGame.attack(ws, newData);
            if (attackRes?.gameStatus !== 'finish'){
                newGame.turn(ws);
            }else {
                newGame.finish(attackRes.winner);
                newGame.updateWinners();
            }
        }
            break;
        default:
            break;
    }
    
  
}