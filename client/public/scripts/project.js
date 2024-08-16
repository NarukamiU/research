// ラベル削除ボタンのクリックイベント
async function handleLabelDeleteClick(event) {
  const projectName = event.target.dataset.projectName;
  const labelName = event.target.dataset.labelName; 

  try {
    const response = await fetch('/label/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectName, labelName })
    });

    if (!response.ok) {
      throw new Error('ラベルの削除に失敗しました');
    }

    const data = await response.json();
    console.log(data.message);

    // ラベル一覧を更新
    displayEachImages(); 
    location.reload();//ページをリロード

  } catch (error) {
    console.error(error);
    alert('ラベルの削除に失敗しました');
  }
}


// DELETEボタンのクリックイベント
async function handleDeleteButtonClick(event) {
  const projectName = document.getElementById("projectLink").textContent.trim();
  const imageName = event.target.dataset.imageName;
  const labelName = event.target.dataset.labelName;

  try {
    const response = await fetch('/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectName, imageName, labelName })
    });

    if (!response.ok) {
      throw new Error('画像の削除に失敗しました');
    }

    const data = await response.json();
    console.log(data.message);

    // 画像一覧を更新
    displayEachImages(); 
    location.reload(); // ページをリロードする

  } catch (error) {
    console.error(error);
    alert('画像の削除に失敗しました');
  }
}

// ラベルをクリックした時のイベントリスナー
function handleLabelClick(event) {
  const labelListPopup = event.target.closest('.image-card').querySelector('.label-list-popup');
  labelListPopup.style.display = labelListPopup.style.display === 'block' ? 'none' : 'block';
}

// ラベルをクリックした時のイベントリスナー
function handleLabelItemClick(event) {
  const imageCard = event.target.closest('.image-card');
  const sourceLabel = imageCard.querySelector('.image-label').textContent; 
  const targetLabel = event.target.dataset.labelName; // 移動先ラベル名を取得
  const imageName = imageCard.dataset.imageName;
  const projectName = document.getElementById("projectLink").textContent.trim();

  // サーバーに画像移動のリクエストを送信
  moveImage(projectName, imageName, sourceLabel,targetLabel)
    .then(() => {
      // 画像が移動された場合、DOMを更新
      displayEachImages(); 
      // ポップアップを閉じる
      event.target.closest('.label-list-popup').style.display = 'none';
    })
    .catch(error => {
      console.error(error);
      alert('画像の移動に失敗しました');
    });
}


// 画像を移動する関数
async function moveImage(projectName, imageName,sourceLabel, targetLabel) {
  try {
    const response = await fetch('/move', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectName, imageName,sourceLabel, targetLabel })
    });

    if (!response.ok) {
      throw new Error('画像の移動に失敗しました');
    }
    location.reload(); // ページをリロードする
    //このリロードは違う位置にいれるべき?にしても処理雑すぎ
      
    const data = await response.json();
    console.log(data.message);

  } catch (error) {
    console.error(error);
    throw error; 
  }
}



// DOMContentLoaded イベント発生時にプロジェクト一覧を表示
document.addEventListener('DOMContentLoaded', () => {
  // 画像のホバーイベント
  const imageGrid = document.getElementById('imageGrid');
  if (imageGrid) {
    // 画像のホバーイベントリスナーを設定する関数
    setupImageHoverEvents(); 
  }

  // 各ラベルの画像を表示する
  displayEachImages();

  // 画像アップロードボタンのクリックイベントリスナーを追加
  const uploadButtons = document.querySelectorAll('.upload-button');
  uploadButtons.forEach(button => {
    button.addEventListener('click', handleUploadButtonClick); // 関数呼び出しに変更
  });

  // ドラッグアンドドロップイベントリスナーを追加
  const imageGridInner = document.querySelectorAll('.image-grid-inner');
  imageGridInner.forEach(grid => {
    grid.addEventListener('dragover', (event) => {
      event.preventDefault();
    });

    grid.addEventListener('drop', handleImageGridDrop); // 関数呼び出しに変更
 
  });


   // ラベルをクリックした時のイベントリスナーを追加
   const imageLabels = document.querySelectorAll('.image-label');
   imageLabels.forEach(label => {
     label.addEventListener('click', handleLabelClick);
   });
 
   // ラベル一覧のポップアップ要素にクリックイベントリスナーを追加
   const labelItems = document.querySelectorAll('.label-item');
   labelItems.forEach(labelItem => {
     labelItem.addEventListener('click', handleLabelItemClick); 
   });
     // DELETEボタンのクリックイベントリスナーを追加
  const deleteButtons = document.querySelectorAll('.delete-button');
  deleteButtons.forEach(button => {
    button.addEventListener('click', handleDeleteButtonClick); 
  });

  // ラベル削除ボタンのクリックイベントリスナーを追加
  const labelDeleteButtons = document.querySelectorAll('.label-delete-button');
  labelDeleteButtons.forEach(button => {
    button.addEventListener('click', handleLabelDeleteClick); 
  });

});


// ラベル追加ボタン
const addLabelButton = document.getElementById('addLabelButton');
const newLabelNameInput = document.getElementById('newLabelName');
const createNewLabelButton = document.getElementById('createNewLabelButton');
const addLabelForm = document.querySelector('.add-label-form');

// ラベル追加ボタンのクリックイベント
addLabelButton.addEventListener('click', () => {
  addLabelForm.style.display = addLabelForm.style.display === 'block' ? 'none' : 'block';
});

// 新しいラベルを作成するボタンのクリックイベント
createNewLabelButton.addEventListener('click', async () => {
  const newLabelName = newLabelNameInput.value.trim();
  if (newLabelName === '') {
    alert('ラベル名を入力してください');
    return;
  }

  try {
    // サーバーに新しいラベルを作成するリクエストを送信
    const projectName = document.getElementById("projectLink").textContent.trim();
    const response = await fetch('/label/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectName, labelName: newLabelName })
    });

    if (!response.ok) {
      throw new Error('ラベルの作成に失敗しました');
    }

    // ラベル一覧を更新
    displayEachImages();
    location.reload(); // ページをリロードする
    // フォームをリセット
    newLabelNameInput.value = '';
    addLabelForm.style.display = 'none';

  } catch (error) {
    console.error(error);
    alert('ラベルの作成に失敗しました');
  }
});



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

// 画像のホバーイベントリスナーを設定する関数
function setupImageHoverEvents() {
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


// 各ラベルの画像を表示する関数
async function displayEachImages() {
  try {
    // URLからプロジェクト名を取得
    const projectName = document.getElementById("projectLink").textContent.trim();
    console.log("プロジェクト名:",projectName);

    // 各ラベルの画像を取得して表示
    const projectPath = `/projects/${projectName}`;

    // プロジェクトフォルダのラベルを取得
    const response = await fetch(`http://localhost:3000/directory?path=${projectPath}`);
    const labelList = await response.json();

    // 各ラベルの画像をコンソールに出力
    labelList.forEach(async (label) => {
      if (label.isDirectory) {
        // ラベルフォルダ内の画像ファイルを昇順で取得
        const response = await fetch(`http://localhost:3000/directory?path=${projectPath}/${label.name}`);
        const imageList = await response.json();

        // 各ラベルの画像名をコンソールに出力
        imageList.forEach(image => {
          if (!image.isDirectory) {
            console.log(`${label.name}: ${image.name}`);

            // 画像プレースホルダーを取得
            const imagePlaceholder = projectContent.querySelector(`.label-container[data-label-id="${label.name}"] .image-card[data-image-name="${image.name}"] .image-placeholder`);
            if (imagePlaceholder) {
              // 画像を取得して表示
              displayImage(projectPath, label.name, image.name, imagePlaceholder);
            }
          }
        });
      }
    });

  } catch (error) {
    console.error(error);
  }
}

// 画像アップロード処理
async function uploadImages(files, targetDirectory) {
  try {
    // FormData を作成
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }
    // path パラメータを追加
    formData.append('path', targetDirectory);

    // 画像をアップロードする
    const response = await fetch('http://localhost:3000/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('画像のアップロードに失敗しました');
    }

    // アップロードが成功したら、画像一覧を更新する
    location.reload();//ページをリロード 

  } catch (error) {
    console.error(error);
    alert('画像のアップロードに失敗しました');
  }
}

// 画像アップロードボタンのクリックイベントリスナーを追加
function handleUploadButtonClick(event) {
  const labelId = event.target.dataset.labelId;
  const projectName = event.target.dataset.projectName;
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.multiple = true;

  fileInput.addEventListener('change', () => {
    uploadImages(fileInput.files, `/projects/${projectName}/${labelId}`);
  });

  fileInput.click();
}

// ドラッグアンドドロップイベントリスナーを追加
function handleImageGridDrop(event) {
  event.preventDefault();

  const files = event.dataTransfer.files;
  const labelId = event.target.closest('.label-container').dataset.labelId;

  // URLからプロジェクト名を取得
  const projectName = document.getElementById("projectLink").textContent.trim(); 
  console.log('projectname',projectName);
  uploadImages(files, `/projects/${projectName}/${labelId}`);
}


const hamburgerMenu = document.getElementById('hamburgerMenu');
const menu = document.getElementById('menu');
// ハンバーガーメニューのクリックイベント
hamburgerMenu.addEventListener('click', () => {
  menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
});

// HOMEボタンのクリックイベント
const homeLinkProject = document.getElementById('homeLink');
homeLinkProject.addEventListener('click', () => {
  window.location.href = '/'; // ルートパスにリダイレクト
});