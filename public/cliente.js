const ws = new WebSocket("ws://" + location.host);
let msg;
let chat;
let cabecalho;
let username; // nome do usuário
let partida_id;
let user_id;

let tabuleiro = [[0, 0], [0, 0]];
let tabuleiro_adversario = [[0, 0], [0, 0]];

function atualiza_tabuleiro(json){
    // limpa o chat
    chat.innerHTML = "";

    // atualiza o tabuleiro do cliente.
    tabuleiro = json.tabuleiro;
    tabuleiro_adversario = json.tabuleiro_adversario;
    
    const divTabuleiro = document.createElement("DIV");
    divTabuleiro.innerHTML = "Tabuleiro: " + JSON.stringify(tabuleiro);
    const divTabuleiroAdv = document.createElement("DIV");
    divTabuleiroAdv.innerHTML = "Tabuleiro Adversário: " + JSON.stringify(tabuleiro_adversario);
    chat.appendChild(divTabuleiro);
    chat.appendChild(divTabuleiroAdv);
}

ws.onmessage = (event) => {        
    console.log(event.data);
    const json = JSON.parse(event.data);
    console.log('json', json);

    if (json.type == "game_start") {
        partida_id = json.partida_id;
        user_id = json.user_id;
        const divIDPartida = document.createElement("DIV");
        const divIDUser = document.createElement("DIV");
        divIDPartida.innerHTML = "ID da Partida: " + json.partida_id;
        divIDUser.innerHTML = "ID do usuário: " + json.user_id;
        cabecalho.appendChild(divIDPartida);
        cabecalho.appendChild(divIDUser);

        // limpa o chat
        atualiza_tabuleiro(json);
    }

    if (json.type == 'update') {
        atualiza_tabuleiro(json);
    }
}

// Função para enviar mensagem que é executada quando se clica no botão
function send() {
    // verifica se o campo de texto da mensagem está vazio
    if (username.value == "") {
        alert("Por favor, digite um nome de usuário!");
        username.focus();
        return;
    }

    // verifica se a mensagem está vazia
    if (msg.value == "") {
        alert("Por favor, digite uma mensagem!");
        msg.focus();
        return;
    }

    // Envia o texto digitado para o servidor pelo WebSocket (Um objeto convertido para string)
    ws.send(JSON.stringify({
        type: 'message', 
        partida_id: partida_id,
        user_id: user_id,
        username: username.value,
        message: msg.value
    }));

    // Limpa o campo de texto da mensagem
    msg.value = '';
    // foca no campo de texto da mensagem para digitar a próxima
    msg.focus();
}

// Função para enviar mensagem que é executada quando se aperta Enter no campo de texto da mensagem
function pressionouTecla(event) {
    if (event.keyCode == 13) { // 13 é o código para a tecla Enter
        send(); // Envia a mensagem
    }
}

window.addEventListener('load', (e) => {
    console.log('load')
    username = document.getElementById('username');
    msg = document.getElementById('message');
    chat = document.getElementById('chat');
    cabecalho = document.getElementById('cabecalho');
});

