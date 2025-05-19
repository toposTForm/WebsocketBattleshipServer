"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const server_1 = require("./server");
class Game {
    createRoom(ws, username, clientID) {
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
    getAvailRoom() {
        let freeRoom = Game.availableRoomList.find((room) => room.available == true);
        return freeRoom;
    }
    updateRoom(ws) {
        let gamers = server_1.WSmain.clientList.map((gamer) => ({
            name: gamer.username,
            index: gamer.clientID,
        }));
        let rooms = Game.availableRoomList.map((room) => ({
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
}
exports.Game = Game;
Game.availableRoomList = [];
;
//# sourceMappingURL=game.js.map