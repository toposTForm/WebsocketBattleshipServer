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
                let gamers = server_1.WSmain.clientList.map((gamer) => ({
                    name: gamer.username,
                    index: gamer.clientID,
                }));
                let rooms = game_1.Game.availableRoomList.map((room) => ({
                    roomId: room.number,
                    roomUsers: gamers
                }));
                let upData = {
                    type: 'update_room',
                    data: JSON.stringify(rooms),
                    id: 0,
                };
                server_1.testWs.wsSentMessageToClient(ws, upData);
            }
            catch (error) {
                console.error(error);
            }
            console.log(server_1.WSmain.clientList);
            break;
        case 'create_room':
            {
                let roomData = server_1.WSmain.clientList.find((user) => {
                    if (user.websocket == ws)
                        return ({
                            name: user.username,
                            clientID: user.clientID
                        });
                });
                server_1.newGame.createRoom(ws, roomData.name, roomData.clientID);
                let gamers = server_1.WSmain.clientList.map((gamer) => ({
                    name: gamer.username,
                    index: gamer.clientID,
                }));
                let rooms = game_1.Game.availableRoomList.map((room) => ({
                    roomId: room.number,
                    roomUsers: gamers
                }));
                let data = {
                    type: 'update_room',
                    data: JSON.stringify(rooms),
                    id: 0,
                };
                server_1.testWs.wsSentMessageToClient(ws, data);
            }
            ;
            break;
        default:
            break;
    }
}
//# sourceMappingURL=router.js.map