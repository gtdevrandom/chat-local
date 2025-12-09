const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

let users = []; // Liste des utilisateurs connectés

io.on('connection', (socket) => {
    console.log('Un utilisateur est connecté');

    // Nouvel utilisateur
    socket.on('new user', ({ pseudo, color }) => {
        socket.pseudo = pseudo;
        socket.color = color || '#4CAF50'; // couleur par défaut

        users.push({
            id: socket.id,
            pseudo,
            color: socket.color
        });

        // Envoyer la liste mise à jour
        io.emit('users list', users);

        // Message système
        io.emit('chat message', { pseudo: 'System', message: `${pseudo} a rejoint le chat.` });
    });

    // Mise à jour du pseudo et couleur
    socket.on('update user', ({ pseudo, color }) => {
        socket.pseudo = pseudo;
        socket.color = color || socket.color;

        // Mettre à jour la liste des utilisateurs
        users = users.map(u => u.id === socket.id ? { ...u, pseudo, color: socket.color } : u);

        io.emit('users list', users);
        io.emit('chat message', { pseudo: 'System', message: `🔄 ${pseudo} a mis à jour son profil.` });
    });

    // Message du chat
    socket.on('chat message', (msg) => {
        io.emit('chat message', { pseudo: socket.pseudo, color: socket.color, message: msg });
    });

    // Déconnexion
    socket.on('disconnect', () => {
        if (socket.pseudo) {
            users = users.filter(u => u.id !== socket.id);
            io.emit('users list', users);
            io.emit('chat message', { pseudo: 'System', message: `${socket.pseudo} a quitté le chat.` });
        }
        console.log('Un utilisateur s\'est déconnecté');
    });
});

http.listen(3000, () => {
    console.log('Serveur sur http://localhost:3000');
});
