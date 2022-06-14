const ws = new WebSocket("ws://" + location.host);
let msgX;
let msgY;
let chat;
let cabecalho;
let notificacoes;
let instrucoes;
let username; // nome do usuário
let partida_id;
let user_id;
let navios_para_colocar;

let tabuleiro = [[0, 0], [0, 0]];
let tabuleiro_adversario = [[0, 0], [0, 0]];

function atualiza_tabuleiro(json){
    // limpa o chat
    chat.innerHTML = "";

    // atualiza o tabuleiro do cliente.
    tabuleiro = json.tabuleiro;
    tabuleiro_adversario = json.tabuleiro_adversario;

    const divTabuleiro = document.createElement("DIV");
    divTabuleiro.innerHTML = "<br/> Tabuleiro: <br/>" + JSON.stringify(tabuleiro).split('],').join("<br />").replaceAll("[", "").replaceAll("]", "");
    const divTabuleiroAdv = document.createElement("DIV");
    divTabuleiroAdv.innerHTML = "<br/> Tabuleiro Adversário: <br/>" + JSON.stringify(tabuleiro_adversario).split('],').join("<br />").replaceAll("[", "").replaceAll("]", "");
    chat.appendChild(divTabuleiro);
    chat.appendChild(divTabuleiroAdv);
}

function atualiza_instrucoes(msg){
    instrucoes.innerHTML = '';
    const divInstrucao = document.createElement("DIV");
    divInstrucao.className = "instrucoes";
    divInstrucao.innerHTML = msg;
    instrucoes.appendChild(divInstrucao);
}

ws.onmessage = (event) => {        
    console.log(event.data);
    const json = JSON.parse(event.data);
    console.log('json', json);

    if (json.type == "game_setup") {
        partida_id = json.partida_id;
        user_id = json.user_id;
        navios_para_colocar = json.qtd_barcos;
        const divIDPartida = document.createElement("DIV");
        const divIDUser = document.createElement("DIV");
        divIDPartida.innerHTML = "ID da Partida: " + json.partida_id;
        divIDUser.innerHTML = "ID do usuário: " + json.user_id;
        cabecalho.appendChild(divIDPartida);
        cabecalho.appendChild(divIDUser);

        atualiza_instrucoes("Você tem: " + navios_para_colocar + " Navios para colocar. Digite uma coordenada x e y e envie para colocar um navio.");
        atualiza_tabuleiro(json);
    }

    if (json.type == "notify") {
        notificacoes.innerHTML = '';
        const divNotificacao = document.createElement("DIV");
        divNotificacao.className = "notificacoes";
        divNotificacao.innerHTML = json.message;
        notificacoes.appendChild(divNotificacao);
    }

    if (json.type == "updt_instrucoes") {
        atualiza_instrucoes(json.message);
    }

    if (json.type == 'update') {
        atualiza_instrucoes(json.instrucao);
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

    // verifica se a mensagem X está vazia
    if (msgX.value == "") {
        alert("Por favor, digite uma coordenada X!");
        msgX.focus();
        return;
    }

    // verifica se a mensagem Y está vazia
    if (msgY.value == "") {
        alert("Por favor, digite uma coordenada Y!");
        msgY.focus();
        return;
    }

    // Envia o texto digitado para o servidor pelo WebSocket (Um objeto convertido para string)
    ws.send(JSON.stringify({
        type: 'message', 
        partida_id: partida_id,
        user_id: user_id,
        username: username.value,
        messageX: msgX.value,
        messageY: msgY.value
    }));

    // Limpa o campo de texto da mensagem
    msgX.value = '';
    msgy.value = '';
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
    msgX = document.getElementById('messageX');
    msgY = document.getElementById('messageY');
    chat = document.getElementById('chat');
    cabecalho = document.getElementById('cabecalho');
    notificacoes = document.getElementById('notificacoes');
    instrucoes = document.getElementById('instrucoes');
});

