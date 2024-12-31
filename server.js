const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// Dados de exemplo de usuários (para autenticação simples)
const users = [
  { username: 'Euxi', password: 'lty2025', name: 'Agneto Wilian', message: 'Feliz Ano Novo, Mano Euxi! Que 2025 traga muita saúde, sucesso e felicidade para você. Agradeço de coração por todos os momentos incríveis, risadas e trocas que tivemos. Que esse novo ano seja repleto de realizações e alegrias. Vamos juntos em mais uma jornada! 🫂', photo: 'https://files.catbox.moe/8etjtg.jpg' },
  { username: 'Mira pod', password: 'lty2025', name: 'Mickael', message: 'Feliz ano novo irmãozin! É nois sempre irmão, tudo de bom pra você, e que esse ano seja repleto de muita saúde, paz e realizações para você meu rei! 🫂', photo: 'https://files.catbox.moe/bkty9g.jpg' },
  { username: 'Light', password: 'lty2025', name: 'Raoã', message: 'Feliz ano novo meu manow, tudo de bom pra você e sua família. Que esse ano de 2025 seja repleto de saúde, sucesso, felicidades e muita rapariga pra você akkaak! É nois irmão! 🫂', photo: 'https://files.catbox.moe/8dw82z.jpg' },
  { username: 'Iguinho', password: 'lty2025', name: 'Igo', message: 'Feliz ano novo igão, é nois meu mano, tudo de bom pra você ai, sucesso!', photo: 'https://files.catbox.moe/khpe78.jpg' },
  { username: 'Sadrack', password: 'lty2025', name: 'Sauã', message: 'Ó sauã, feliz ani novo meu manow, tudo de bom pra ti, que esse ano de 2025 traga muita saúde e paz irmão! É nois sempre! 🫂', photo: 'https://files.catbox.moe/wkcemu.jpg' },
  { username: 'Livinha', password: 'lty2025', name: 'Livia', message: 'Feliz ano novo, véia! 😂 Brincadeira, tá? Mas é isso, te desejo tudo de bom mesmo! Que 2025 seja cheio de saúde, paz e muitas conquistas pra você! 🫂 PS: foi mal, essa era a única foto sua que eu tinha KKK.', photo: 'https://files.catbox.moe/kw7adc.jpg' },
  { username: 'Mikael', password: 'lty2025', name: 'Mikael', message: 'Feliz ano novo irmão, tudo de bom para você! 🫂', photo: 'https://files.catbox.moe/lpv1yn.jpg' },
  { username: 'Tilt', password: 'lty2025', name: 'Thiago', message: 'Feliz ano novo ai meu mano, tmj cachorra! 🫂', photo: '' },
  { username: 'Ribeiro', password: 'lty2025', name: 'Ribeiro', message: 'Eai fi, feliz ano novo! tudo de bom pra ti, que esse ano de 2025 lhe traga muita saúde, paz e realizações para a sua vida!', photo: 'https://files.catbox.moe/4sp0k3.jpg' },
  { username: 'Manu', password: 'lty2025', name: 'Manu', message: 'Feliz ano novo, Manuzinha! 🥳 Te desejo tudo de bom, viu? Que 2025 te traga muita saúde, paz, sucesso e muitas realizações! Sei que a gente não conversa tanto, mas espero que isso mude logo!', photo: '' }
];

// Caminho para o arquivo de sessões
const sessionFilePath = path.join(__dirname, 'sessions.json');

// Carregar sessões do arquivo JSON (se existir)
let sessions = {};
if (fs.existsSync(sessionFilePath)) {
  sessions = JSON.parse(fs.readFileSync(sessionFilePath, 'utf-8'));
}

// Função para salvar sessões no arquivo JSON
const saveSessions = () => {
  fs.writeFileSync(sessionFilePath, JSON.stringify(sessions, null, 2));
};

// Middleware para interpretar os dados do formulário
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Middleware para capturar o IP do cliente
app.use((req, res, next) => {
  req.clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  next();
});

// Servir arquivos estáticos (CSS, imagens, etc)
app.use(express.static(path.join(__dirname, 'public')));

// Definir o diretório de views para EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const commentsFile = path.join(__dirname, 'comments.json');

// Carregar comentários do arquivo JSON
let comments = [];
if (fs.existsSync(commentsFile)) {
  comments = JSON.parse(fs.readFileSync(commentsFile, 'utf-8'));
}

app.post('/geral/comment', (req, res) => {
  const { author, message } = req.body;
  const username = req.query.username;

  if (author && message) {
    const newComment = { 
      id: Date.now(),
      author, 
      message 
    };
    comments.push(newComment);

    // Salvar os comentários no arquivo
    fs.writeFileSync(commentsFile, JSON.stringify(comments, null, 2));

    // Redirecionar de volta para a página de comentários, mantendo o username na query string
    res.redirect(`/geral?username=${username}`);
  } else {
    res.status(400).send('Autor e mensagem são obrigatórios.');
  }
});

app.post('/geral/comment/:id/delete', (req, res) => {
  const commentId = parseInt(req.params.id);
  const username = req.query.username || req.body.username;
  let user;

  // Encontrar o usuário na sessão
  for (const key in sessions) {
    if (sessions[key].name === username) {
      user = sessions[key];
      break;
    }
  }

  if (!user) {
    return res.status(401).send('Usuário não autenticado.');
  }

  // Encontra o comentário a ser excluído
  const commentIndex = comments.findIndex(comment => comment.id === commentId);

  if (commentIndex !== -1) {
    const comment = comments[commentIndex];

    // Verifica se o usuário é o autor do comentário
    if (comment.author === user.name) {
      comments.splice(commentIndex, 1); // Remove o comentário
      fs.writeFileSync(commentsFile, JSON.stringify(comments, null, 2));

      // Renderiza diretamente a página com os comentários atualizados
      res.redirect(`/geral?username=${username}`);
    } else {
      res.status(403).send('Você não tem permissão para apagar este comentário.');
    }
  } else {
    res.status(404).send('Comentário não encontrado.');
  }
});

// Função para salvar IPs no arquivo JSON
const logLoginAttempt = (username, ip) => {
  const filePath = path.join(__dirname, 'logins.json');

  // Lê o arquivo JSON existente ou cria um novo
  let data = {};
  if (fs.existsSync(filePath)) {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  // Adiciona o IP ao usuário
  if (!data[username]) {
    data[username] = [];
  }
  if (!data[username].includes(ip)) {
    data[username].push(ip);
  }

  // Salva o JSON atualizado
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Rota para a página de login
app.get('/', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Verificar se o usuário existe
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    // Registra o IP do usuário
    sessions[username] = user;
    saveSessions();
    logLoginAttempt(username, req.clientIp);

    // Redireciona para a home com os dados do usuário
    res.redirect(`/home?username=${username}`);
  } else {
    // Se não encontrar, redireciona de volta para o login
    res.send('Usuário ou senha inválidos');
  }
});

app.get('/home', (req, res) => {
  const username = req.query.username; // Pega o username da query string
  const user = sessions[username]; // Obtém o usuário correto da sessão

  if (user) {
    res.render('home', { user });
  } else {
    res.send('Usuário não encontrado');
  }
});

// Rota geral para visualizar o controle de logins
// Rota geral para visualizar o controle de logins
app.get('/users', (req, res) => {
  res.json(sessions);
});

// Rota para servir as imagens dos amigos
app.get('/images/:img', (req, res) => {
  const imgPath = path.join(__dirname, 'public', 'images', req.params.img);
  res.sendFile(imgPath);
});

app.get('/geral', (req, res) => {
  const username = req.query.username;
  let user;

  // Verificar se o usuário está na sessão
  for (const key in sessions) {
    if (sessions[key].name === username) {
      user = sessions[key];
      break;
    }
  }

  if (!user) {
    return res.status(401).send('Volte a página, e recarregue ela para aparecer o comentário.');  // Redireciona para a página de login se o usuário não for encontrado
  }

  const commentsFile = path.join(__dirname, 'comments.json');
  fs.readFile(commentsFile, 'utf8', (err, data) => {
    if (err) {
      console.error('Erro ao ler o arquivo de comentários:', err);
      return res.status(500).send('Erro ao carregar os comentários.');
    }

    const comments = data ? JSON.parse(data) : [];
    res.render('geral', { user, comments });
  });
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

