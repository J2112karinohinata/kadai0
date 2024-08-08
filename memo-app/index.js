const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// 静的ファイルの配信
app.use(express.static('public'));

// body-parserミドルウェアの設定
app.use(bodyParser.urlencoded({ extended: true }));

// メインページのルート
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// メモを保存するルート
app.post('/save', (req, res) => {
  const { title, memo } = req.body;
  const data = `Title: ${title}\nMemo: ${memo}\n\n`;

  fs.appendFile('memos.txt', data, (err) => {
    if (err) {
      console.error('Failed to save memo:', err);
      res.status(500).send('Failed to save memo');
    } else {
      res.redirect('/view');
    }
  });
});

// メモを表示するルート
app.get('/view', (req, res) => {
  fs.readFile('memos.txt', 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to read memos:', err);
      res.status(500).send('Failed to read memos');
    } else {
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>View Memos</title>
        </head>
        <body>
          <h1>Saved Memos</h1>
          <ul>
            ${data.split('\n\n').map((memo, index) => `
              <li>
                <pre>${memo}</pre>
                <form action="/edit" method="post" style="display:inline;">
                  <input type="hidden" name="index" value="${index}">
                  <button type="submit">Edit</button>
                </form>
                <form action="/delete" method="post" style="display:inline;">
                  <input type="hidden" name="index" value="${index}">
                  <button type="submit">Delete</button>
                </form>
              </li>
            `).join('')}
          </ul>
          <a href="/">Back to home</a>
        </body>
        </html>
      `);
    }
  });
});

// メモを削除するルート
app.post('/delete', (req, res) => {
  const index = parseInt(req.body.index);
  
  fs.readFile('memos.txt', 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to read memos:', err);
      res.status(500).send('Failed to read memos');
      return;
    }
    
    const memos = data.split('\n\n');
    if (index < 0 || index >= memos.length) {
      res.status(400).send('Invalid index');
      return;
    }
    
    memos.splice(index, 1);
    fs.writeFile('memos.txt', memos.join('\n\n'), (err) => {
      if (err) {
        console.error('Failed to delete memo:', err);
        res.status(500).send('Failed to delete memo');
      } else {
        res.redirect('/view');
      }
    });
  });
});

// メモを編集するルート
app.post('/edit', (req, res) => {
  const index = parseInt(req.body.index);
  
  fs.readFile('memos.txt', 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to read memos:', err);
      res.status(500).send('Failed to read memos');
      return;
    }
    
    const memos = data.split('\n\n');
    if (index < 0 || index >= memos.length) {
      res.status(400).send('Invalid index');
      return;
    }
    
    const memo = memos[index];
    const [titleLine, ...memoLines] = memo.split('\n');
    const title = titleLine.replace('Title: ', '');
    const memoContent = memoLines.join('\n').replace('Memo: ', '');

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Edit Memo</title>
      </head>
      <body>
        <h1>Edit Memo</h1>
        <form action="/update" method="post">
          <input type="hidden" name="index" value="${index}">
          <label for="title">Title:</label>
          <input type="text" id="title" name="title" value="${title}" required><br><br>
          <label for="memo">Memo:</label><br>
          <textarea id="memo" name="memo" rows="10" cols="30" required>${memoContent}</textarea><br><br>
          <input type="submit" value="Update">
        </form>
        <a href="/view">Back to memos</a>
      </body>
      </html>
    `);
  });
});

// メモを更新するルート
app.post('/update', (req, res) => {
  const index = parseInt(req.body.index);
  const { title, memo } = req.body;
  const updatedMemo = `Title: ${title}\nMemo: ${memo}\n\n`;

  fs.readFile('memos.txt', 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to read memos:', err);
      res.status(500).send('Failed to read memos');
      return;
    }
    
    const memos = data.split('\n\n');
    if (index < 0 || index >= memos.length) {
      res.status(400).send('Invalid index');
      return;
    }
    
    memos[index] = updatedMemo;
    fs.writeFile('memos.txt', memos.join('\n\n'), (err) => {
      if (err) {
        console.error('Failed to update memo:', err);
        res.status(500).send('Failed to update memo');
      } else {
        res.redirect('/view');
      }
    });
  });
});

// サーバーの起動
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
