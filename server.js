require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`[SERVER] POS Inventory System running on port ${PORT}`);
    console.log(`[URL] http://localhost:${PORT}`);
});
