"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = router;
const server_1 = require("./server");
const game_1 = require("./game");
function router(ws, message) {
    switch (message.type) {
        case 'reg':
            let clientUUID = crypto.randomUUID();
            try {
                let name = JSON.parse(message.data.toString()).name;
                let password = JSON.parse(message.data.toString()).password;
                if (server_1.WSmain.clientList.length == 0) {
                    server_1.WSmain.pushClientToList({ websocket: ws, username: name, password: password, clientID: clientUUID });
                }
                let findIfUserAlreadyRegistered = server_1.WSmain.clientList.find((user) => user.username == name);
                if (!findIfUserAlreadyRegistered) {
                    server_1.WSmain.pushClientToList({ websocket: ws, username: name, password: password, clientID: clientUUID });
                }
                let data = {
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
                server_1.testWs.wsSentMessageToClient(ws, data);
                server_1.newGame.updateRoom();
                server_1.newGame.updateWinners();
                console.log(`Request | 'req' | name: ${name}, password: ${password}`);
                console.log(`Response | 'req' | name: ${name}, index: ${clientUUID}, error: ${false}, errorText: 'noError'`);
            }
            catch (error) {
                console.error(error);
                let data = {
                    type: 'reg',
                    data: {
                        name: 'not registered',
                        index: 'not registered',
                        error: true,
                        errorText: error,
                    },
                    id: 0,
                };
                server_1.testWs.wsSentMessageToClient(ws, data);
            }
            break;
        case 'create_room':
            {
                let roomData = server_1.WSmain.clientList.find((user) => {
                    if (user.websocket == ws)
                        return ({
                            username: user.username,
                            clientID: user.clientID
                        });
                });
                server_1.newGame.createRoom(ws, roomData.username, roomData.clientID);
                console.log(`Request | 'create_room' |`);
                server_1.newGame.updateRoom();
            }
            ;
            break;
        case 'add_user_to_room':
            {
                let indexRoom = JSON.parse(message.data.toString()).indexRoom;
                let roomData = server_1.WSmain.clientList.find((user) => {
                    if (user.websocket == ws)
                        return ({
                            name: user.username,
                            clientID: user.clientID
                        });
                });
                console.log(`Request | 'add_user_to_room' | `);
                if (server_1.newGame.addUserToRoom(ws, indexRoom, roomData.username, roomData.clientID)) {
                    server_1.newGame.createGame(ws);
                    server_1.newGame.updateRoom();
                }
                ;
            }
            break;
        case 'add_ships':
            {
                try {
                    let data = JSON.parse(message.data.toString());
                    let gameId = data.gameId;
                    let ships = data.ships;
                    let indexPlayer = data.indexPlayer;
                    server_1.newGame.placeShipsOnBoard(ws, gameId, ships, indexPlayer);
                    let gameBoardIndex = game_1.Game.gameBoard.findIndex((gamer) => gamer.gameId == gameId);
                    if (game_1.Game.gameBoard[gameBoardIndex].gamersNeedInside.length == 2) {
                        server_1.newGame.startGame(gameId);
                        server_1.newGame.turn(ws);
                    }
                }
                catch (error) {
                    console.log(error);
                }
            }
            break;
        case 'attack':
            {
                let data = JSON.parse(message.data.toString());
                let attackRes = server_1.newGame.attack(ws, data);
                console.log(`Request | 'attack' | data: ${data}`);
                if ((attackRes === null || attackRes === void 0 ? void 0 : attackRes.gameStatus) !== 'finish') {
                    server_1.newGame.turn(ws);
                }
                else {
                    server_1.newGame.finish(attackRes.winner);
                    server_1.newGame.updateWinners();
                }
            }
            break;
        case 'randomAttack':
            {
                let data = JSON.parse(message.data.toString());
                let randomX = Math.floor((Math.random() * 10));
                let randomY = Math.floor((Math.random() * 10));
                let newData = {
                    gameId: data.gameId,
                    x: randomX,
                    y: randomY,
                    indexPlayer: data.indexPlayer,
                };
                let attackRes = server_1.newGame.attack(ws, newData);
                if ((attackRes === null || attackRes === void 0 ? void 0 : attackRes.gameStatus) !== 'finish') {
                    server_1.newGame.turn(ws);
                }
                else {
                    server_1.newGame.finish(attackRes.winner);
                    server_1.newGame.updateWinners();
                }
            }
            break;
        default:
            break;
    }
}
//# sourceMappingURL=router.js.map