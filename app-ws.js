const WebSocket = require('ws');
const uuid = require('uuid');

let waiting_clients = 0;
let clients = [];
let partidas = {};
const tabuleiro_base = [[0, 0], [0, 0]];
 
function onError(ws, err) {
    console.error(`onError: ${err.message}`);
}
 
function onMessage(ws, data) {
    console.log(`onMessage: ${data}`);
    const json = JSON.parse(data);
    ws.send(JSON.stringify({
        type: 'confirmation',
        data: 'Recebido'
    }));

    if (json.message == "A1") {
        if (partidas[json.partida_id].jogador1.user_id == json.user_id) {
            partidas[json.partida_id].jogador1.tabuleiro = [[1, 0], [0, 0]];
            partidas[json.partida_id].jogador2.tabuleiro_adversario = [[1, 0], [0, 0]];
        }
        else{
            partidas[json.partida_id].jogador2.tabuleiro = [[1, 0], [0, 0]];
            partidas[json.partida_id].jogador1.tabuleiro_adversario = [[1, 0], [0, 0]];
        }
    }
    
    partidas[json.partida_id].jogador1.client.send(
        JSON.stringify({
            type: 'update',
            tabuleiro: partidas[json.partida_id].jogador1.tabuleiro,
            tabuleiro_adversario: partidas[json.partida_id].jogador1.tabuleiro_adversario,
        })
    );

    partidas[json.partida_id].jogador2.client.send(
        JSON.stringify({
            type: 'update',
            tabuleiro: partidas[json.partida_id].jogador2.tabuleiro,
            tabuleiro_adversario: partidas[json.partida_id].jogador2.tabuleiro_adversario,
        })
    );
}

function onClose(ws, reasonCode, description) {
    console.log(`onClose: ${reasonCode} - ${description}`);
    const index = clients.indexOf(ws);
    if (index > -1) {
        clients.splice(index, 1);
    }
    waiting_clients--;
}
 
function onConnection(ws, req) {
    clients.push(ws);
    waiting_clients++;
    console.log(`onConnection`);
    console.log(`Jogadores Esperando: ${waiting_clients}`);
    if (waiting_clients >= 2) {
        console.log(`Quantidade mínima de jogadores atingida. Partida formada!`);
        let id  = uuid.v4();
        let user_ids = [uuid.v4(), uuid.v4()];
        partidas[id] = {
            jogador1: {
                client: clients[0],
                user_id: user_ids[0],
                websocket: 0,
                tabuleiro: tabuleiro_base,
                tabuleiro_adversario: tabuleiro_base
            },
            jogador2: {
                client: clients[1],
                user_id: user_ids[1],
                websocket: 0,
                tabuleiro: tabuleiro_base,
                tabuleiro_adversario: tabuleiro_base
            },
            situacao: 0,
            vencedor: -1,
            vez: 0
        }

        for (const [i, client] of clients.entries()) {
            console.log(`Enviando informações da partida para o cliente ${i}`);
            client.send(JSON.stringify({
                type: 'game_start',
                partida_id: id,
                user_id: user_ids[i],
            }));
        }

        clients = [];
        waiting_clients = 0;
    }

    ws.on('message', data => onMessage(ws, data));
    ws.on('error', error => onError(ws, error));
    ws.on('close', (reasonCode, description) => onClose(ws, reasonCode, description));
    ws.send(JSON.stringify({
        type: 'connection',
        data: 'Bem vindo'
    }))
}
 
module.exports = (server) => {
    const wss = new WebSocket.Server({
        server
    });
 
    wss.on('connection', onConnection);
 
    console.log(`App Web Socket Server is running!`);
    return wss;
}