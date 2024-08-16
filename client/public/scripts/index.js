// プロジェクト一覧を表示する関数
async function displayProjects() {
  try {
    const response = await fetch('http://localhost:3000/directory?path=projects'); // projectsディレクトリの内容を取得
    const projectList = await response.json();

    // projectsのコンテンツエリアを取得
    const projectsContainer = projectContent.querySelector('.project-list'); 

    if (!projectsContainer) { // project-list要素が存在しない場合
      console.error('プロジェクトリストの要素が見つかりません');
      return;
    }

    // プロジェクト一覧をクリア
    projectsContainer.innerHTML = ''; 

    // フォルダ名（プロジェクト名）をプロジェクトエリアに表示
    projectList.forEach(project => {
      if (project.isDirectory) {
        const projectCard = document.createElement('div');
        projectCard.classList.add('card');
        projectCard.setAttribute('data-project-id', project.name); // プロジェクトIDを設定

        // 画像プレースホルダー
        const imagePlaceholder = document.createElement('div');
        imagePlaceholder.classList.add('image-placeholder');
        projectCard.appendChild(imagePlaceholder);

        const projectName = document.createElement('p');
        projectName.textContent = project.name;
        projectCard.appendChild(projectName);

        // サーバーからサムネイル画像を取得して表示
        getThumbnailImage(`/projects/${project.name}`, imagePlaceholder); // サムネイル画像を取得して表示する関数

        // プロジェクトカードをクリックした時のイベントリスナー
        projectCard.addEventListener('click', () => {
          // クリックされたプロジェクトの画像を表示
          window.location.href = `/project/${project.name}`; // プロジェクトページにリダイレクト
        });

        projectsContainer.appendChild(projectCard);
      }
    });

  } catch (error) {
    console.error(error);
    showNotification('プロジェクト一覧の取得に失敗しました。');
  }
}


// 画像を表示する関数
async function displayImage(imagePath, labelName, imageName, imageContainer) { 
  try {
      const response = await fetch(`http://localhost:3000/images?path=${imagePath}/${labelName}/${imageName}`); // API 呼び出しにラベル名と画像名を追加
      const blob = await response.blob();

      const img = document.createElement('img');
      img.src = URL.createObjectURL(blob);
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';

      imageContainer.innerHTML = ''; // 既存の画像をクリア
      imageContainer.appendChild(img);

  } catch (error) {
      console.error(error);
      alert('画像の取得に失敗しました');
  }
}

// サムネイル画像を取得して表示する関数
async function getThumbnailImage(projectPath, imageContainer) {
try {
  // プロジェクトフォルダのラベルを取得
  const response = await fetch(`http://localhost:3000/directory?path=${projectPath}`);
  const labelList = await response.json();

  let selectedLabel = null;
  let selectedImage = null;

  // ラベルの昇順で最初のラベルを取得
  labelList.forEach(label => {
    if (label.isDirectory && (!selectedLabel || label.name < selectedLabel)) {
      selectedLabel = label.name;
    }
  });

  if (selectedLabel) {
    // ラベルフォルダ内の画像ファイルを昇順で取得
    const response = await fetch(`http://localhost:3000/directory?path=${projectPath}/${selectedLabel}`);
    const imageList = await response.json();

    imageList.forEach(image => {
      if (!image.isDirectory && (!selectedImage || image.name < selectedImage)) {
        selectedImage = image.name;
      }
    });

    if (selectedImage) {
      // サムネイル画像を表示
      displayImage(projectPath, selectedLabel, selectedImage, imageContainer);
    }
  }
} catch (error) {
  console.error(error);
  // alert('画像の取得に失敗しました'); // エラーメッセージを表示しないようにする
}
}

// DOMContentLoaded イベント発生時にプロジェクト一覧を表示
document.addEventListener('DOMContentLoaded', () => {
  displayProjects(); 
});

// 画像のホバーイベント
const imageGrid = document.getElementById('imageGrid');
if (imageGrid) {
imageGrid.addEventListener('mouseover', (event) => {
  const imageCard = event.target.closest('.image-card');
  if (imageCard) {
    const imageName = imageCard.dataset.imageName;
    const imageNameSpan = imageCard.querySelector('.image-name');
    imageNameSpan.textContent = imageName;
    imageNameSpan.style.display = 'block';
  }
});
imageGrid.addEventListener('mouseout', (event) => {
  const imageCard = event.target.closest('.image-card');
  if (imageCard) {
    const imageNameSpan = imageCard.querySelector('.image-name');
    imageNameSpan.style.display = 'none';
  }
});
}

// 新しいプロジェクトを作成するボタン
const newProjectButton = document.getElementById('newProjectButton');
const newProjectNameInput = document.getElementById('newProjectName');
const createNewProjectButton = document.getElementById('createNewProjectButton');
const createProjectForm = document.querySelector('.create-project-form');

// プロジェクト作成ボタンのクリックイベント
newProjectButton.addEventListener('click', () => {
  createProjectForm.style.display = createProjectForm.style.display === 'block' ? 'none' : 'block';
});

// 新しいプロジェクトを作成するボタンのクリックイベント
createNewProjectButton.addEventListener('click', async () => {
  const newProjectName = newProjectNameInput.value.trim();
  if (newProjectName === '') {
    alert('プロジェクト名を入力してください');
    return;
  }

  try {
    // サーバーに新しいプロジェクトを作成するリクエストを送信
    const response = await fetch('/project/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectName: newProjectName })
    });

    if (!response.ok) {
      throw new Error('プロジェクトの作成に失敗しました');
    }

    // プロジェクトが正常に作成された場合
    alert('プロジェクトが作成されました');
    // プロジェクト一覧を更新
    displayProjects();
    // フォームをリセット
    newProjectNameInput.value = '';
    createProjectForm.style.display = 'none';

  } catch (error) {
    console.error(error);
    alert('プロジェクトの作成に失敗しました');
  }
});


const projectContent = document.getElementById('projectContent'); // projectのコンテンツエリアの要素を取得
const projectCards = projectContent.querySelectorAll('.card'); // projectのカードの要素を取得

const projectLink = document.getElementById('projectLink');
const settingLink = document.getElementById('settingLink');
const projectContentDiv = document.getElementById('projectContent');
const settingContentDiv = document.getElementById('settingContent');

const hamburgerMenu = document.getElementById('hamburgerMenu');
const menu = document.getElementById('menu');
// ハンバーガーメニューのクリックイベント
hamburgerMenu.addEventListener('click', () => {
  menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
});

// サイドバーのリンクをクリックした時のイベントリスナー
projectLink.addEventListener('click', () => {
  projectLink.classList.add('active');
  settingLink.classList.remove('active');
  projectContentDiv.style.display = 'block';
  settingContentDiv.style.display = 'none';
});

settingLink.addEventListener('click', () => {
  projectLink.classList.remove('active');
  settingLink.classList.add('active');
  projectContentDiv.style.display = 'none';
  settingContentDiv.style.display = 'block';
});



// HOMEボタンのクリックイベント
const homeLink = document.getElementById('homeLink');
homeLink.addEventListener('click', () => {
  window.location.href = '/'; // ルートパスにリダイレクト
});