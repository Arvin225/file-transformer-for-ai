const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const progressArea = document.getElementById('progressArea');
const resultArea = document.getElementById('resultArea');
const formatRadios = document.querySelectorAll('input[name="format"]');

// 格式配置
const formatConfig = {
  'word-md': { accept: '.docx,.doc', ext: '.md', name: 'Word' },
  'word-html': { accept: '.docx,.doc', ext: '.html', name: 'Word' },
  'excel-md': { accept: '.xlsx,.xls', ext: '.md', name: 'Excel' },
  'csv-md': { accept: '.csv', ext: '.md', name: 'CSV' }
};

// 点击上传
dropZone.addEventListener('click', () => fileInput.click());

// 格式切换时更新文件输入框
formatRadios.forEach(radio => {
  radio.addEventListener('change', updateFileInput);
});

function updateFileInput() {
  const format = document.querySelector('input[name="format"]:checked').value;
  const config = formatConfig[format];
  fileInput.accept = config.accept;
  
  // 更新提示文字
  const fileTypesText = document.querySelector('.file-types');
  fileTypesText.textContent = `支持 ${config.accept} 格式`;
}

// 初始化
updateFileInput();

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
  // 获取选择的格式并验证文件类型
  const format = document.querySelector('input[name="format"]:checked').value;
  const config = formatConfig[format];
  
  const extPattern = config.accept.replace(/,/g, '|').replace(/\./g, '\\.');
  const regex = new RegExp(`(${extPattern})$`, 'i');
  
  if (!file.name.match(regex)) {
    alert(`请上传 ${config.name} 文件 (${config.accept})`);
    return;
  }

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
    // 从响应头获取文件名
    const disposition = response.headers.get('content-disposition');
    let filename = file.name.replace(/\.[^/.]+$/, config.ext);
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match) filename = match[1].replace(/['"]/g, '');
    }
    return response.blob().then(blob => ({ blob, filename }));
  })
  .then(({ blob, filename }) => {
    // 下载文件
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
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
