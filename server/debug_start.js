console.log('Iniciando debug...');
try {
    const express = require('express');
    console.log('Express ok');
    const cors = require('cors');
    console.log('Cors ok');
    const sequelize = require('./database/db');
    console.log('Sequelize db loaded');
    const User = require('./models/User');
    console.log('User model loaded');
    const Voter = require('./models/Voter');
    console.log('Voter model loaded');

    const app = express();
    console.log('App created');

    const authRoutes = require('./routes/authRoutes');
    console.log('Auth routes loaded');
    const voterRoutes = require('./routes/voterRoutes');
    console.log('Voter routes loaded');
    // const reportRoutes = require('./routes/reportRoutes'); 
    // console.log('Report routes loaded');

    app.use(cors());
    app.use(express.json());

    app.use('/api/auth', authRoutes);
    app.use('/api/voters', voterRoutes);
    // app.use('/api/reports', reportRoutes);

    console.log('Routes middleware set');

    sequelize.sync({ alter: true }).then(() => {
        console.log('DB Sync OK');
    }).catch(err => {
        console.error('DB Sync Error:', err);
    });

} catch (error) {
    console.error('CRASH DETECTED:', error);
}
