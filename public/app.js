const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const progressArea = document.getElementById('progressArea');
const resultArea = document.getElementById('resultArea');

// 点击上传
dropZone.addEventListener('click', () => fileInput.click());

// 文件选择
fileInput.addEventListener('change', handleFile);

// 拖拽事件
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    uploadFile(files[0]);
  }
});

function handleFile(e) {
  const file = e.target.files[0];
  if (file) {
    uploadFile(file);
  }
}

function uploadFile(file) {
  // 验证文件类型
  if (!file.name.match(/\.(docx|doc)$/i)) {
    alert('请上传 Word 文件 (.docx 或 .doc)');
    return;
  }

  // 获取选择的格式
  const format = document.querySelector('input[name="format"]:checked').value;
  const ext = format === 'html' ? '.html' : '.md';

  // 显示进度
  dropZone.classList.add('hidden');
  progressArea.classList.remove('hidden');
  resultArea.classList.add('hidden');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('format', format);

  fetch('/convert', {
    method: 'POST',
    body: formData
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(data => {
        throw new Error(data.error || '转换失败');
      });
    }
    return response.blob();
  })
  .then(blob => {
    // 下载文件
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.replace(/\.docx?$/i, ext);
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    // 显示成功
    progressArea.classList.add('hidden');
    resultArea.classList.remove('hidden');

    // 3秒后重置
    setTimeout(() => {
      resetUI();
    }, 3000);
  })
  .catch(error => {
    alert('错误: ' + error.message);
    resetUI();
  });
}

function resetUI() {
  dropZone.classList.remove('hidden');
  progressArea.classList.add('hidden');
  resultArea.classList.add('hidden');
  fileInput.value = '';
}
