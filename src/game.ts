import { WSmain, testWs } from "./server";
import { ResCreateGame, ResFinish, ResStartGame, ResTurn, ResUpdateRoom, ResUpdateWinners } from "./resTypes";  
import Websocket from 'ws';
import { ResAttack } from "./resTypes";


export class Game  {
    static availableRoomList: Array<{
        number: number, 
        available: boolean, 
        gamersInside: Array<{socket: Websocket, username: string, clientID: string}>}> = [];
    static occupiedRoomList: Array<{
        idGame?: number | string,
        roomNumber: number | string, 
        gameActivated: boolean, 
        gamersInside: Array<{socket: Websocket, username: string, clientID: string}>}> = [];
    static gameBoard: Array<{
        roomNumber: number | string,
        gameId: Number | string, 
        gamersNeedInside: Array<{socket: Websocket, username: string, clientID: string | number}>,
        shipsGamerOne: [
            {
                position: 
                    {
                        x: number, 
                        y: number,
                    }, 
                direction: boolean, 
                length: number, 
                type:  "small"|"medium"|"large"|"huge"
            }
        ] | Array<{}>,
         shipsGamerTwo: [
            {
                position: 
                    {
                        x: number, 
                        y: number,
                    }, 
                direction: boolean, 
                length: number, 
                type:  "small"|"medium"|"large"|"huge"
            }
        ] | Array<{}> | null
        indexPlayerOne: number | string | null,
        indexPlayerTwo: number | string | null
        }> = [];
    static winnerTable: Array<{name: string, wins: number | string}> = [];
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
    public updateRoom(){
        let upData: any = {
            type: 'update_room',
            data: JSON.stringify(Game.availableRoomList.map(gamer => ({
                roomId: gamer.number,
                roomUsers: gamer.gamersInside.map(gamerInside => ({
                    name: gamerInside.username,
                    index: gamerInside.clientID,
                }))
            }))),
        };
        WSmain.clientList.forEach((client) => {
            testWs.wsSentMessageToClient(client.websocket, upData);
            console.log(`Response | 'update_room' | data: ${upData.data}`);
        });
    }
    public addUserToRoom(ws: Websocket, indexRoom: string | number, name: string, clientID: string): boolean{
        let roomIndexToRemove = Game.availableRoomList.findIndex((room) => (room.number == indexRoom && room.available));//find needed room by room index
        let existingUserInRoom =  Game.availableRoomList[roomIndexToRemove].gamersInside[0].username;
        let existingClientIDInRoom =  Game.availableRoomList[roomIndexToRemove].gamersInside[0].clientID;
        let idGame = Game.occupiedRoomList.length;
        if (existingUserInRoom !== name && existingClientIDInRoom !== clientID){
            Game.availableRoomList[roomIndexToRemove].gamersInside.push({socket: ws, username: name, clientID}); //add User to existing room
            let gamersInRoom =  Game.availableRoomList[roomIndexToRemove].gamersInside;
            Game.occupiedRoomList.push({ 
                roomNumber: indexRoom,
                gameActivated: false,
                idGame: idGame,
                gamersInside: gamersInRoom
            })
            Game.availableRoomList.splice(roomIndexToRemove, 1); //remove occupied room from available list
            return true;
        }else{
            console.error(`Gamer with name ${name} already in room! You can't play with yourself!`);
            return false;
        }
    }
    public createGame(ws: Websocket){
        let roomIndex = Game.occupiedRoomList.findIndex((gamer: any) => gamer.gamersInside.find((user: any) => user.socket == ws && user.clientID !== ''));
        let idGame = Game.occupiedRoomList[roomIndex].idGame;
        Game.occupiedRoomList[roomIndex].gameActivated = true;
        let gamersInsideRoom = Game.occupiedRoomList[roomIndex].gamersInside;
        let gamerOneID = gamersInsideRoom.find((gamer) => gamer.socket == ws)?.clientID;
        let gamerOneSocket = ws;
        let data: ResCreateGame = {
            type: 'create_game',
            data: JSON.stringify({
                idGame: idGame,
                idPlayer: gamerOneID,
            }),
            id: 0,
        };
        testWs.wsSentMessageToClient(gamerOneSocket, data);
        let gamerTwoID = gamersInsideRoom.find((gamer) => gamer.socket !== ws)?.clientID;
        let gamerTwoSocket = gamersInsideRoom.find((gamer) => gamer.socket !== ws)?.socket;
        let data2: ResCreateGame = {
            type: 'create_game',
            data: JSON.stringify({
                idGame: idGame,
                idPlayer: gamerTwoID,
            }),
            id: 0,
        };
        testWs.wsSentMessageToClient(gamerTwoSocket as Websocket, data2);
    };
    public placeShipsOnBoard(ws: Websocket, gameid: number | string, ships: Array<{}>, indexPlayer: number | string){
        let roomIndex = Game.occupiedRoomList.findIndex((room) => (room.idGame == gameid));//find needed room by room index
        let roomNumber =  Game.occupiedRoomList[roomIndex].roomNumber;
        let gamerPlacedShipsName = Game.occupiedRoomList[roomIndex].gamersInside.find((user) => user.socket == ws)?.username;
        let gamerPlacedShips;
        let findBoard = Game.gameBoard.findIndex((gamer) => gamer.gameId == gameid);
        let bla: any = [];
        if (gamerPlacedShipsName !== undefined){ 
            gamerPlacedShips = { socket: ws, username: gamerPlacedShipsName, clientID: indexPlayer };
            if (Game.gameBoard.length == 0 || findBoard == -1){
            bla.push(gamerPlacedShips);
            Game.gameBoard.push({
                roomNumber: roomNumber,
                gameId: gameid,
                gamersNeedInside: bla,
                shipsGamerOne: ships,
                shipsGamerTwo: null,
                indexPlayerOne: indexPlayer,
                indexPlayerTwo: null,
            })
            } else{
                let gameBoardIndex = Game.gameBoard.findIndex((gamer) => gamer.gameId == gameid);
                gamerPlacedShips = { socket: ws, username: gamerPlacedShipsName, clientID: indexPlayer };
                if (Game.gameBoard[gameBoardIndex].gamersNeedInside.length < 2){
                    Game.gameBoard[gameBoardIndex].gamersNeedInside.push(gamerPlacedShips);
                }
                Game.gameBoard[gameBoardIndex].shipsGamerTwo = ships;
                Game.gameBoard[gameBoardIndex].indexPlayerTwo = indexPlayer;
            }
        }
    }
    public startGame(gameid: string | number){
        let gameBoardIndex = Game.gameBoard.findIndex((gamer) => gamer.gameId == gameid);
        let shipsGamerOne = Game.gameBoard[gameBoardIndex].shipsGamerOne;
        let playerIndex = Game.gameBoard[gameBoardIndex].indexPlayerOne;
        let socketPlayerOne = Game.gameBoard[gameBoardIndex].gamersNeedInside.find((gamer) => gamer.clientID == playerIndex)?.socket;
        let data: ResStartGame = {
            type: "start_game",
            data: JSON.stringify({
                ships: shipsGamerOne,
                currentPlayerIndex: playerIndex,
            }),
            id: 0,
        };
        let shipsGamerTwo = Game.gameBoard[gameBoardIndex].shipsGamerTwo;
        playerIndex = Game.gameBoard[gameBoardIndex].indexPlayerTwo;
        let socketPlayerTwo = Game.gameBoard[gameBoardIndex].gamersNeedInside.find((gamer) => gamer.clientID == playerIndex)?.socket;
        testWs.wsSentMessageToClient(socketPlayerOne as Websocket, data);
        console.log(`Response | 'start_game' | currentPlayerIndex ${playerIndex} ships: ${shipsGamerOne}`);
        let data2: ResStartGame = {
            type: "start_game",
            data: JSON.stringify({
                ships: shipsGamerTwo,
                currentPlayerIndex: playerIndex,
            }),
            id: 0,
        };
        testWs.wsSentMessageToClient(socketPlayerTwo as Websocket, data2);
        if (Game.gameBoard[gameBoardIndex].shipsGamerOne !== null){
            let temp = Game.gameBoard[gameBoardIndex].shipsGamerOne.map((ship: any) => ({
                position: recalcPos(ship.position.x, ship.position.y, ship.length, ship.direction),
                direction: ship.direction,
                length: ship.length,
                type: ship.type,
                status: 'miss',
            }));
            Game.gameBoard[gameBoardIndex].shipsGamerOne = temp;
        }
        if (Game.gameBoard[gameBoardIndex].shipsGamerTwo !== null){
            let temp = Game.gameBoard[gameBoardIndex].shipsGamerTwo = Game.gameBoard[gameBoardIndex].shipsGamerTwo.map((ship: any) => ({
                position: recalcPos(ship.position.x, ship.position.y, ship.length, ship.direction),
                direction: ship.direction,
                length: ship.length,
                type: ship.type,
                status: 'miss'
            }));
            Game.gameBoard[gameBoardIndex].shipsGamerTwo = temp;
        }
        return Game.gameBoard[gameBoardIndex];
    }
    public turn(ws: Websocket){
        let gameBoardIndex = Game.gameBoard.findIndex((item) => item.gamersNeedInside.find((gamer: any) => gamer.socket == ws && gamer.clientID !== ''));
        if (gameBoardIndex !== -1){
            let gamerOneIndex = Game.gameBoard[gameBoardIndex].gamersNeedInside.findIndex((gamer) => gamer.socket == ws);
            let gamerTwoIndex = Game.gameBoard[gameBoardIndex].gamersNeedInside.findIndex((gamer) => gamer.socket !== ws);
            let gamerOneId = Game.gameBoard[gameBoardIndex].gamersNeedInside[gamerOneIndex].clientID;
            let gamerTwoId = Game.gameBoard[gameBoardIndex].gamersNeedInside[gamerTwoIndex].clientID;
            let gamerOneSocket = Game.gameBoard[gameBoardIndex].gamersNeedInside[gamerOneIndex].socket;
            let gamerTwoSocket = Game.gameBoard[gameBoardIndex].gamersNeedInside[gamerTwoIndex].socket;
            let data: ResTurn = {
                type: "turn",
                data: JSON.stringify({
                    currentPlayer: gamerOneId
                }),
                id: 0,
            };
            testWs.wsSentMessageToClient(gamerOneSocket, data);
            console.log(`Response | 'turn' | currentPlayer ${gamerOneId}`);
            let data2: ResTurn = {
                type: "turn",
                data: JSON.stringify({
                    currentPlayer: gamerTwoId
                }),
                id: 0,
            };
            testWs.wsSentMessageToClient(gamerTwoSocket, data2);
            console.log(`Response | 'turn' | currentPlayer ${gamerTwoId}`);
        }
    }
    public attack(socket: Websocket, data: any){
        let gamerOnesocket = socket;
        let gamerOneData;
        let x = data.x;
        let y = data.y;
        let shipsGamerTwo;
        let gamerOneIndex = data.indexPlayer;
        let gamerTwosocket;
        let gamerTwoIndex;
        let gamerTwoName;
        let boardIndex = Game.gameBoard.findIndex((gamer) => gamer.indexPlayerOne == data.indexPlayer || gamer.indexPlayerTwo == data.indexPlayer);
        if (boardIndex !== -1){
            if (Game.gameBoard[boardIndex].indexPlayerOne == data.indexPlayer){
                shipsGamerTwo = Game.gameBoard[boardIndex].shipsGamerTwo;
                gamerTwosocket = Game.gameBoard[boardIndex].gamersNeedInside.find((gamer) => {
                    if (gamer.clientID !== data.indexPlayer){
                        return gamer.socket;
                    }
                });
                gamerOneData = Game.gameBoard[boardIndex].gamersNeedInside.find((gamer: any) => gamer.clientID == data.indexPlayer);
                let gamerOneName = gamerOneData?.username;
                if (shipsGamerTwo !== null){
                    let strikeResult = checkStrike(shipsGamerTwo, x, y);
                    let upData: ResAttack = {
                        type: "attack",
                        data: JSON.stringify(
                            {
                                position:
                                    {
                                        x: x,
                                        y: y,
                                    },
                                currentPlayer: gamerOneIndex, /* id of the player in the current game session */
                                status: strikeResult.status,
                            }),
                        id: 0,
                    };
                    testWs.wsSentMessageToClient(gamerOnesocket, upData);
                    testWs.wsSentMessageToClient(gamerTwosocket?.socket as Websocket, upData);
                    if (strikeResult.status == 'killed'){
                        strikeResult.coordToBlow.forEach((pos: {x: number, y: number}) => {
                        let upData: ResAttack = {
                        type: "attack",
                            data: JSON.stringify(
                                {
                                    position:
                                        {
                                            x: pos.x,
                                            y: pos.y,
                                        },
                                    currentPlayer: gamerOneIndex, /* id of the player in the current game session */
                                    status: strikeResult.status,
                                }),
                            id: 0,
                        };
                        setTimeout(() => {
                            testWs.wsSentMessageToClient(gamerOnesocket, upData);
                        }, 100)
                        })
                    };
                    console.log(`Response | 'attack' | x: ${x}, y: ${y}, currentPlayer: ${gamerOneIndex}, status: ${strikeResult.status}`);
                    if (gameIsFinished(shipsGamerTwo, gamerOnesocket)){
                        let findWinner = Game.winnerTable.find((winner) => winner.name == gamerOneName);
                        let findWinnerIndex = Game.winnerTable.findIndex((winner) => winner.name == gamerOneName);
                        if (findWinner == undefined){
                            Game.winnerTable.push({
                                name: gamerOneName as string,
                                wins: 1
                            })
                        } else {
                            Game.winnerTable[findWinnerIndex].wins = Game.winnerTable[findWinnerIndex].wins as number + 1;
                        }
                        let temp = {gameStatus: 'finish', winner: gamerOneIndex}
                        return  temp;
                    } else {
                        let temp = {gameStatus: 'inProcess', winner: null }
                        return temp;
                    }
                } 
            }else{
                gamerTwoIndex = Game.gameBoard[boardIndex].indexPlayerOne;
                gamerTwosocket = Game.gameBoard[boardIndex].gamersNeedInside.find((gamer) => gamer.clientID !== data.indexPlayer)?.socket;
                gamerTwoName = Game.gameBoard[boardIndex].gamersNeedInside.find((gamer) => gamer.clientID !== data.indexPlayer)?.username;
                shipsGamerTwo = Game.gameBoard[boardIndex].shipsGamerOne;
                gamerOneData = Game.gameBoard[boardIndex].gamersNeedInside.find((gamer: any) => gamer.clientID == data.indexPlayer);
                let gamerOneName = gamerOneData?.username;
                if (shipsGamerTwo !== null){
                    let strikeResult = checkStrike(shipsGamerTwo, x, y);
                    let upData: ResAttack = {
                        type: "attack",
                        data: JSON.stringify(
                            {
                                position:
                                    {
                                        x: x,
                                        y: y,
                                    },
                                currentPlayer: gamerOneIndex, /* id of the player in the current game session */
                                status: strikeResult.status,
                            }),
                        id: 0,
                    }
                    testWs.wsSentMessageToClient(gamerOnesocket, upData);
                    testWs.wsSentMessageToClient(gamerTwosocket as Websocket, upData);
                    if (strikeResult.status == 'killed'){
                        strikeResult.coordToBlow.forEach((pos: {x: number, y: number}) => {
                        let upData: ResAttack = {
                        type: "attack",
                            data: JSON.stringify(
                                {
                                    position:
                                        {
                                            x: pos.x,
                                            y: pos.y,
                                        },
                                    currentPlayer: gamerOneIndex, /* id of the player in the current game session */
                                    status: strikeResult.status,
                                }),
                            id: 0,
                        };
                        setTimeout(() => {
                            testWs.wsSentMessageToClient(gamerOnesocket, upData);
                        }, 100)
                        })
                    };
                    console.log(`Response | 'attack' | x: ${x}, y: ${y}, currentPlayer: ${gamerOneIndex}, status: ${strikeResult.status}`);
                    if (gameIsFinished(shipsGamerTwo, gamerOnesocket)){
                        let findWinner = Game.winnerTable.find((winner) => winner.name == gamerOneName);
                        let findWinnerIndex = Game.winnerTable.findIndex((winner) => winner.name == gamerOneName);
                        if (findWinner == undefined){
                            Game.winnerTable.push({
                                name: gamerOneName as string,
                                wins: 1
                            })
                        } else {
                            Game.winnerTable[findWinnerIndex].wins = Game.winnerTable[findWinnerIndex].wins as number + 1;
                        }
                        let temp = {gameStatus: 'finish', winner: gamerOneIndex}
                        return  temp;
                    } else {
                        let temp = {gameStatus: 'inProcess', winner: null }
                        return temp;
                    } 
                } 
            }
        }
    }
    public finish(winnerId: string){
        let boardIndex = Game.gameBoard.findIndex((gamer) => gamer.indexPlayerOne == winnerId);
        if (boardIndex == -1) boardIndex = Game.gameBoard.findIndex((gamer) => gamer.indexPlayerTwo == winnerId);
        let winnerSocket = Game.gameBoard[boardIndex].gamersNeedInside.find((gamer) => gamer.clientID == winnerId)?.socket;
        let looserSocket = Game.gameBoard[boardIndex].gamersNeedInside.find((gamer) => gamer.clientID !== winnerId)?.socket;
        let idGame = Game.gameBoard[boardIndex].gameId;
        let data: ResFinish = {
            type: 'finish',
            data: JSON.stringify({
                winPlayer: winnerId,
            }),
            id: 0,
        };
        testWs.wsSentMessageToClient(winnerSocket as Websocket, data);
        testWs.wsSentMessageToClient(looserSocket as Websocket, data);
        
        // Game.gameBoard.splice(boardIndex, 1);
        Game.gameBoard[boardIndex].gameId = '';
        Game.gameBoard[boardIndex].indexPlayerOne = '';
        Game.gameBoard[boardIndex].indexPlayerTwo = '';
        Game.gameBoard[boardIndex].roomNumber = '';
        Game.gameBoard[boardIndex].gamersNeedInside[0].clientID = '';
        Game.gameBoard[boardIndex].gamersNeedInside[0].username = '';
         Game.gameBoard[boardIndex].gamersNeedInside[1].clientID = '';
        Game.gameBoard[boardIndex].gamersNeedInside[1].username = '';
        let occupiedRoomIndex = Game.occupiedRoomList.findIndex((roomList) => roomList.idGame == idGame);
        // Game.occupiedRoomList.splice(occupiedRoomIndex, 1);
        Game.occupiedRoomList[occupiedRoomIndex].idGame = '';
        Game.occupiedRoomList[occupiedRoomIndex].roomNumber = '';
        Game.occupiedRoomList[occupiedRoomIndex].gamersInside[0].clientID = '';
        Game.occupiedRoomList[occupiedRoomIndex].gamersInside[1].clientID = '';
        console.log(`Response | 'finish' | winPlayer: ${winnerId}`);

    }
    public updateWinners(){
        let data: ResUpdateWinners = {
            type: 'update_winners',
            data: JSON.stringify(Game.winnerTable),
            id: 0,
        }
        WSmain.clientList.forEach((client) => {
            testWs.wsSentMessageToClient(client.websocket, data);
        });
        console.log(`Response | 'update_winners'| ${(data.data)}`);
    }
};
function recalcPos(x: number, y: number, length: number, direction: boolean){
            let position = [];
            if (!direction) {
                for (let index = 0; index < length; index++) {
                    let coord = {
                        x: x + index,
                        y: y,
                    }
                    position.push(coord);
                }
                return  position;
            }else {
                  for (let index = 0; index < length; index++) {
                    let coord = {
                        x: x,
                        y: y + index,
                    }
                    position.push(coord);
                }
                return  position;
            }
}

function checkStrike(ships: any, x: number, y: number){
    let status: "miss"|"killed"|"shot";
    let shipIndex = ships.findIndex((ship: any) => ship.position.find((pos: any) => pos.x == x && pos.y ==y));
    let shipPosIndex;
    let coordToBlow;
    if (shipIndex !== -1){
        shipPosIndex = ships[shipIndex].position.findIndex((pos: any) => pos.x == x && pos.y ==y);
        if (shipPosIndex !== -1){
            ships[shipIndex].length--;
            if (ships[shipIndex].length == 0 || ships[shipIndex].length < 0){
                ships[shipIndex].status = 'killed';
                status = 'killed';
                coordToBlow = ships[shipIndex].position;
            }else {
                ships[shipIndex].status = 'shot';
                status = 'shot';
            }
        } else{
            status = 'miss';
        }
    }else {
        status = 'miss';
    }
    return {ships: ships, status: status, coordToBlow};
} 

function gameIsFinished(ships: {}[], ws: Websocket): boolean {
    let gamestatus = ships.find((ship: any) => ship.status == 'miss');
    if (gamestatus !== undefined){
        return false;
    } else {
        return true;
    }
}
        