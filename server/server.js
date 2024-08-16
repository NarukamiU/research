const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs-extra'); 
const path = require('path');
const { randomBytes } = require('crypto'); 
const ejs = require('ejs'); // EJSをインポート

const app = express();
const port = 3000;

const uploadDir = path.join(__dirname, '../images');

// uploadsディレクトリがなければ作成する
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// ファイルアップロード設定
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const targetDirectory = req.body.path || '';
    const targetPath = path.join(uploadDir, targetDirectory); 
    cb(null, targetPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // 元のファイル名を使用
  }
});
const upload = multer({ storage });

// CORSを許可するミドルウェアを追加
app.use(cors({
  origin: 'http://127.0.0.1:5500', // クライアント側のドメインを指定
  methods: ['GET', 'POST', 'DELETE', 'PUT'], // 許可するHTTPメソッドを指定
  allowedHeaders: ['Content-Type'], // 許可するHTTPヘッダーを指定
}));

// JSON Body Parsing Middlewareを追加
app.use(express.json()); // 最大リクエストサイズを 50MB に設定
app.use('/uploads', express.static('../images'));

// 静的ファイルを提供するためのミドルウェアを追加
app.use(express.static(path.join(__dirname, '../client/public'), {
  setHeaders: (res, path, stat) => {
    // ファイルタイプに基づいてMIMEタイプを設定
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
})); // 静的ファイルのルートパスを指定

// EJSの設定
app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname,'views')); // テンプレートファイルが置かれているディレクトリを指定 (serverディレクトリ内)

// ルートパスに対するリクエストを処理
app.get('/', (req, res) => {
  // プロジェクト一覧をサーバーサイドで取得
  fs.readdir(path.join(uploadDir, 'projects'), { withFileTypes: true })
    .then(files => {
      const projects = files.filter(file => file.isDirectory()).map(file => file.name);
      // index.ejsにプロジェクト一覧を渡してレンダリング
      res.render('index', { projects }); 
    })
    .catch(err => {
      console.error('プロジェクト一覧取得エラー:', err);
      res.status(500).send('プロジェクト一覧取得失敗'); 
    });
});

// ファイルアップロード API
app.post('/upload', upload.array('files', 10), async (req, res) => { // upload.single を upload.array に変更
  console.log('req.body.path:', req.body.path);
  console.log('req.files:', req.files); // アップロードされたファイルの配列

  try {
    // ディレクトリが存在しない場合は作成
    await fs.ensureDir(path.join(uploadDir, req.body.path));

    // 各ファイルを指定されたパスに移動
    for (const file of req.files) {
      const destination = path.join(uploadDir, req.body.path, file.filename);
      
      await fs.move(file.path, destination);
    }

    const projectName = req.body.path.split('/')[1]; // project名を取得
    res.json({ message: 'ファイルアップロード成功', filenames: req.files.map(file => file.filename), projectName }); // projectName をレスポンスに追加
  } catch (err) {
    console.error('ファイルアップロードエラー:', err);
    res.status(500).json({ error: 'ファイルアップロード失敗' });
  }
});

// ディレクトリ一覧取得 API
app.get('/directory', async (req, res) => {
  const directoryPath = req.query.path ? path.join(uploadDir, req.query.path) : uploadDir; // クエリパラメータからパスを取得

  try {
    const files = await fs.readdir(directoryPath, { withFileTypes: true });
    const directoryContent = files.map(file => ({
      name: file.name,
      isDirectory: file.isDirectory(),
      path: path.relative(uploadDir, path.join(directoryPath, file.name)) // 相対パスを生成
    }));
    res.json(directoryContent); 
  } catch (err) {
    console.error('ディレクトリ取得エラー:', err);
    res.status(500).json({ error: 'ディレクトリ取得失敗' }); 
  }
});

// 画像を移動する API
app.put('/move', async (req, res) => {
  const projectName = req.body.projectName;
  const imageName = req.body.imageName;
  const targetLabel = req.body.targetLabel;
  const sourceLabel = req.body.sourceLabel;

  const sourcePath = path.join(uploadDir, 'projects', projectName, sourceLabel, imageName); // sourceLabel を使用
  const targetPath = path.join(uploadDir, 'projects', projectName, targetLabel, imageName); // 画像の移動先のパス
  console.log('sourcePath',sourcePath)
  console.log('targetPath',targetPath)
  try {
    await fs.move(sourcePath, targetPath);
    res.json({ message: '画像が移動されました' });
  } catch (err) {
    console.error('画像移動エラー:', err);
    res.status(500).json({ error: '画像の移動に失敗しました' });
  }
});

// ディレクトリ作成 API
app.post('/mkdir', async (req, res) => {
  const directoryPath = path.join(uploadDir, req.body.path, req.body.name);

  try {
    await fs.mkdir(directoryPath, { recursive: true });
    res.json({ message: 'ディレクトリ作成成功' });
  } catch (err) {
    console.error('ディレクトリ作成エラー:', err);
    res.status(500).json({ error: 'ディレクトリ作成失敗' }); 
  }
});

// ディレクトリ削除 API
app.delete('/rmdir', async (req, res) => {
  const directoryPath = path.join(uploadDir, req.body.path);

  try {
    await fs.rm(directoryPath, { recursive: true });
    res.json({ message: 'ディレクトリ削除成功' });
  } catch (err) {
    console.error('ディレクトリ削除エラー:', err);
    res.status(500).json({ error: 'ディレクトリ削除失敗' }); 
  }
});


// ファイル削除 API
app.delete('/delete', async (req, res) => {
  const projectName = req.body.projectName;
  const imageName = req.body.imageName;
  const labelName = req.body.labelName; 
  const filePath = path.join(uploadDir, 'projects', projectName, labelName, imageName);

  try {
    await fs.unlink(filePath);
    res.json({ message: 'ファイル削除成功' });
  } catch (err) {
    console.error('ファイル削除エラー:', err);
    res.status(500).json({ error: 'ファイル削除失敗' }); 
  }
});




// ディレクトリリネーム API
app.put('/rename', async (req, res) => {
  const oldDirectoryPath = path.join(uploadDir, req.body.oldPath);
  const newDirectoryPath = path.join(uploadDir, req.body.newPath);
  
  console.log('oldDirectorypath:',oldDirectoryPath);
  console.log('newDirectorypath:',newDirectoryPath);
  try {
    await fs.rename(oldDirectoryPath, newDirectoryPath);
    res.json({ message: 'ディレクトリリネーム成功' });
  } catch (err) {
    console.error('ディレクトリリネームエラー:', err);
    res.status(500).json({ error: 'ディレクトリリネーム失敗' }); 
  }
});

// 画像を取得するAPIエンドポイント
app.get('/images', async (req, res) => {
  const imagePath = req.query.path ? path.join(uploadDir, req.query.path) : null;
  if (imagePath) {
    try {
      const imageData = await fs.readFile(imagePath);
      res.setHeader('Content-Type', 'image/jpeg'); // ファイルタイプに応じて適切なMIMEタイプを設定
      res.send(imageData);
    } catch (err) {
      console.error('画像取得エラー:', err);
      res.status(500).json({ error: '画像取得失敗' }); 
    }
  } else {
    res.status(404).send('画像が見つかりません');
  }
});


// 各プロジェクトページへのルーティング
app.get('/project/:projectName', async (req, res) => {
  const projectName = req.params.projectName;

  try {
    // プロジェクトフォルダのラベル情報を取得
    const labelList = await getLabelsForProject(projectName); // ラベル情報を取得する関数
    // プロジェクトフォルダの画像情報を取得
    const imageList = await getImagesForProject(projectName); // 画像情報を取得する関数
    res.render('project', { projectName, labels: labelList, images: imageList, projectName }); // projectName をデータとして渡すように変更
  } catch (err) {
    console.error('プロジェクト情報取得エラー:', err);
    res.status(500).send('プロジェクト情報取得失敗');
  }
});

// 新しいプロジェクトを作成する API
app.post('/project/create', async (req, res) => {
  const projectName = req.body.projectName;

  const projectDir = path.join(uploadDir, 'projects', projectName);

  try {
    await fs.mkdir(projectDir);
    res.json({ message: 'プロジェクトが作成されました' });
  } catch (err) {
    console.error('プロジェクト作成エラー:', err);
    res.status(500).json({ error: 'プロジェクトの作成に失敗しました' });
  }
});

// 新しいラベルを作成する API
app.post('/label/create', async (req, res) => {
  const projectName = req.body.projectName;
  const labelName = req.body.labelName;

  const labelDir = path.join(uploadDir, 'projects', projectName, labelName);

  try {
    await fs.mkdir(labelDir);
    res.json({ message: 'ラベルが作成されました' });
  } catch (err) {
    console.error('ラベル作成エラー:', err);
    res.status(500).json({ error: 'ラベルの作成に失敗しました' });
  }
});





// ラベルを削除する API
app.delete('/label/delete', async (req, res) => {
  const projectName = req.body.projectName;
  const labelName = req.body.labelName;

  const labelDir = path.join(uploadDir, 'projects', projectName, labelName);

  try {
    await fs.rm(labelDir, { recursive: true });
    res.json({ message: 'ラベルが削除されました' });
  } catch (err) {
    console.error('ラベル削除エラー:', err);
    res.status(500).json({ error: 'ラベルの削除に失敗しました' });
  }
});

// ラベル情報を取得する関数
async function getLabelsForProject(projectName) {
  const projectDir = path.join(uploadDir, 'projects', projectName);

  try {
    const files = await fs.readdir(projectDir, { withFileTypes: true });
    const labels = files.filter(file => file.isDirectory()).map(file => ({
      name: file.name,
      // ここではラベルIDは仮で生成
      id: file.name,
      // ラベルごとの画像数をカウント
      count: fs.readdirSync(path.join(projectDir, file.name)).filter(f => !fs.lstatSync(path.join(projectDir, file.name, f)).isDirectory()).length 
    }));
    return labels;
  } catch (err) {
    console.error('ラベル情報取得エラー:', err);
    throw err; 
  }
}

// 画像情報を取得する関数
async function getImagesForProject(projectName) {
  const projectDir = path.join(uploadDir, 'projects', projectName);

  try {
    const labels = await fs.readdir(projectDir);
    let images = [];

    for (const label of labels) {
      const labelDir = path.join(projectDir, label);
      const files = await fs.readdir(labelDir);
      images = images.concat(files.map(file => ({
        name: file,
        label: label 
      })));
    }
    return images;
  } catch (err) {
    console.error('画像情報取得エラー:', err);
    throw err; 
  }
}

app.listen(port, () => {
  console.log(`サーバーが起動しました: http://localhost:${port}`);
});