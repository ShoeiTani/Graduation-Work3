const video = document.getElementById('video');
const canvas = document.getElementById('output');
const ctx = canvas.getContext('2d');
const fileInput = document.getElementById('fileInput');

// 関節ペアの定義（骨格描画用）
const adjacentKeyPoints = [
    [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],
    [5, 11], [6, 12], [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
    [0, 1], [1, 3], [0, 2], [2, 4]
];

// 動画をアップロードした際にビデオを読み込む
fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    const url = URL.createObjectURL(file);
    video.src = url;
    video.load();
    video.play();
});

// PoseNetモデルの読み込み
async function loadModel() {
    const net = await posenet.load();
    return net;
}

// ポーズを検出する関数
async function detectPose(net) {
    const pose = await net.estimateSinglePose(video, {
        flipHorizontal: false
    });
    return pose;
}

// キーポイントを描画する
function drawKeypoints(keypoints) {
    keypoints.forEach((keypoint) => {
        if (keypoint.score > 0.6) {
            const { x, y } = keypoint.position;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = 'red';
            ctx.fill();
        }
    });
}

// 骨格を描画する
function drawSkeleton(keypoints) {
    adjacentKeyPoints.forEach(([i, j]) => {
        const pointA = keypoints[i];
        const pointB = keypoints[j];

        if (pointA.score > 0.6 && pointB.score > 0.6) {
            ctx.beginPath();
            ctx.moveTo(pointA.position.x, pointA.position.y);
            ctx.lineTo(pointB.position.x, pointB.position.y);
            ctx.strokeStyle = 'blue';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });
}

// ポーズを描画する関数
function drawPose(pose) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const keypoints = pose.keypoints;
    drawKeypoints(keypoints);
    drawSkeleton(keypoints);
}

// メイン処理
async function main() {
    const net = await loadModel();

    function poseDetectionFrame() {
        if (video.readyState === 4) { // 動画が再生できる状態か確認
            detectPose(net).then(pose => {
                drawPose(pose);
            });
        }
        requestAnimationFrame(poseDetectionFrame);
    }

    poseDetectionFrame();
}

// 動画のメタデータが読み込まれたらポーズ検出開始
video.onloadedmetadata = () => {
    // ビデオのアスペクト比に基づいてCanvasサイズを調整
    const aspectRatio = video.videoWidth / video.videoHeight;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // ポーズ検出開始
    main();
};
