<template>
  <div class="polygon-drawer-container">
    <h2 class="section-title">Draw Polygon</h2>
    <div class="input-group">
      <input type="file" @change="handleImageUpload" class="file-input" />
      <button v-if="imageUrl" @click="removeImage" class="btn btn-danger">
        Remove Image
      </button>
    </div>

    <div v-if="imageUrl" class="image-wrapper">
      <img
        :src="imageUrl"
        ref="imageRef"
        alt="Uploaded Image"
        :style="imageStyles"
        @load="initializeCanvas"
        class="uploaded-image"
      />
      <canvas
        ref="canvasRef"
        class="canvas-overlay"
        @click="handleCanvasClick"
        @mousemove="previewPolygon"
        @contextmenu.prevent="submitPolygon"
      ></canvas>
    </div>

    <div v-if="editingPolygonIndex !== null" class="edit-section">
      <h3 class="section-subtitle">Edit Polygon Name:</h3>
      <div class="input-group">
        <input
          type="text"
          v-model="selectedPolygonName"
          placeholder="Polygon Name"
          class="input-field"
        />
        <button @click="updatePolygonName" class="btn btn-primary">
          Save Name
        </button>
      </div>
    </div>

    <div v-if="polygons.length" class="polygons-list-section">
      <h3 class="section-subtitle">Saved Polygons:</h3>
      <button @click="exportImageWithPolygons" class="btn btn-primary" style="margin-bottom: 1rem; align-self: flex-start;">
        Export Image with Polygons
      </button>
      <ul class="polygon-list">
        <li v-for="(polygon, index) in polygons" :key="index" class="polygon-list-item">
          <span @click="editPolygon(index)" class="polygon-name-link">{{ polygon.name }}</span>
          <button @click="removePolygon(index)" class="btn btn-sm btn-danger">
            Remove
          </button>
        </li>
      </ul>
    </div>

    <div v-if="clickedPolygonName" class="clicked-polygon-info">
      <h4 class="info-title">Clicked Polygon:</h4>
      <p class="info-name">{{ clickedPolygonName }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, nextTick } from 'vue';

const imageRef = ref(null);
const canvasRef = ref(null);
const imageUrl = ref(null);
const imageOriginalWidth = ref(0);
const imageOriginalHeight = ref(0);

const polygons = reactive([]);
const polygonPoints = ref([]);
const currentMousePosition = ref({ x: 0, y: 0 });

const editingPolygonIndex = ref(null);
const selectedPolygonName = ref('');
const clickedPolygonName = ref('');

const imageStyles = ref({});

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (file) {
    imageUrl.value = URL.createObjectURL(file);
    localStorage.setItem('uploadedImage', imageUrl.value);

    imageOriginalWidth.value = 0;
    imageOriginalHeight.value = 0;
    imageStyles.value = {};

    polygons.splice(0, polygons.length);
    polygonPoints.value = [];
    editingPolygonIndex.value = null;
    selectedPolygonName.value = '';
    clickedPolygonName.value = '';
    savePolygonsToLocalStorage();
  }
}

function removeImage() {
  imageUrl.value = null;
  localStorage.removeItem('uploadedImage');
  polygons.splice(0, polygons.length);
  polygonPoints.value = [];
  editingPolygonIndex.value = null;
  selectedPolygonName.value = '';
  clickedPolygonName.value = '';
  imageOriginalWidth.value = 0;
  imageOriginalHeight.value = 0;
  imageStyles.value = {};
  savePolygonsToLocalStorage();
  if (canvasRef.value) {
    const ctx = canvasRef.value.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
  }
}

function initializeCanvas() {
  const canvas = canvasRef.value;
  const image = imageRef.value;

  if (canvas && image) {
    if (imageOriginalWidth.value === 0) {
      imageOriginalWidth.value = image.naturalWidth;
      imageOriginalHeight.value = image.naturalHeight;
    }

    const maxWidth = 800;
    const maxHeight = 600;

    let displayWidth = image.naturalWidth;
    let displayHeight = image.naturalHeight;

    if (displayWidth > maxWidth) {
      displayHeight = (displayHeight * maxWidth) / displayWidth;
      displayWidth = maxWidth;
    }

    if (displayHeight > maxHeight) {
      displayWidth = (displayWidth * maxHeight) / displayHeight;
      displayHeight = maxHeight;
    }

    imageStyles.value = {
      width: `${displayWidth}px`,
      height: `${displayHeight}px`,
      maxWidth: `${maxWidth}px`,
      maxHeight: `${maxHeight}px`,
      objectFit: 'contain'
    };

    nextTick(() => {
        canvas.width = image.clientWidth;
        canvas.height = image.clientHeight;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        redrawAllPolygons(ctx);
    });
  }
}

function redrawAllPolygons(ctx) {
  polygons.forEach(polygon => {
    drawPolygonShape(ctx, polygon.points, 'red', 'rgba(255, 0, 0, 0.3)', true);
  });

  if (polygonPoints.value.length > 1) {
    drawPolygonShape(ctx, polygonPoints.value, 'blue', null, false);
  }

  if (polygonPoints.value.length > 0) {
    const lastPoint = polygonPoints.value[polygonPoints.value.length - 1];
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(currentMousePosition.value.x, currentMousePosition.value.y);
    ctx.strokeStyle = 'green';
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawPolygonShape(ctx, points, strokeStyle, fillStyle, closePath = true) {
  if (points.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  if (closePath) {
    ctx.closePath();
  }
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = 1;
  ctx.stroke();
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
}

function handleCanvasClick(event) {
  const x = event.offsetX;
  const y = event.offsetY;

  if (editingPolygonIndex.value === null) {
    polygonPoints.value.push({ x, y });
    initializeCanvas();
  } else {
    checkPolygon(x, y);
  }
}

function previewPolygon(event) {
  currentMousePosition.value = { x: event.offsetX, y: event.offsetY };
  initializeCanvas();
}

function submitPolygon() {
  if (polygonPoints.value.length > 2) {
    polygons.push({
      name: `Polygon ${polygons.length + 1}`,
      points: [...polygonPoints.value]
    });

    polygonPoints.value = [];
    savePolygonsToLocalStorage();
    initializeCanvas();
  } else {
    alert('A polygon requires at least 3 points. Please add more points or right-click to close.');
  }
}

function savePolygonsToLocalStorage() {
  localStorage.setItem('polygons', JSON.stringify(polygons));
}

function editPolygon(index) {
  editingPolygonIndex.value = index;
  selectedPolygonName.value = polygons[index].name;
  clickedPolygonName.value = '';
  initializeCanvas();
}

function updatePolygonName() {
  if (editingPolygonIndex.value !== null && selectedPolygonName.value.trim() !== '') {
    polygons[editingPolygonIndex.value].name = selectedPolygonName.value.trim();
    savePolygonsToLocalStorage();
    editingPolygonIndex.value = null;
    selectedPolygonName.value = '';
    initializeCanvas();
  } else if (selectedPolygonName.value.trim() === '') {
    alert('Please enter a name for the polygon.');
  }
}

function removePolygon(index) {
  polygons.splice(index, 1);
  savePolygonsToLocalStorage();
  initializeCanvas();
  if (editingPolygonIndex.value === index) {
    editingPolygonIndex.value = null;
    selectedPolygonName.value = '';
  } else if (editingPolygonIndex.value > index) {
    editingPolygonIndex.value--;
  }
  clickedPolygonName.value = '';
}

function isPointInPolygon(polygon, x, y) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function checkPolygon(clientX, clientY) {
  let foundPolygon = null;
  for (const polygon of polygons) {
    if (isPointInPolygon(polygon.points, clientX, clientY)) {
      foundPolygon = polygon;
      break;
      }
  }

  if (foundPolygon) {
    clickedPolygonName.value = foundPolygon.name;
  } else {
    clickedPolygonName.value = '';
  }
}

function exportImageWithPolygons() {
  if (!imageRef.value || polygons.length === 0) {
    alert('Please upload an image and draw at least one polygon to export.');
    return;
  }

  const exportCanvas = document.createElement('canvas');
  const ctx = exportCanvas.getContext('2d');

  const originalWidth = imageOriginalWidth.value;
  const originalHeight = imageOriginalHeight.value;
  exportCanvas.width = originalWidth;
  exportCanvas.height = originalHeight;

  ctx.drawImage(imageRef.value, 0, 0, originalWidth, originalHeight);

  const scaleX = originalWidth / imageRef.value.clientWidth;
  const scaleY = originalHeight / imageRef.value.clientHeight;

  polygons.forEach(polygon => {
    const scaledPoints = polygon.points.map(point => ({
      x: point.x * scaleX,
      y: point.y * scaleY
    }));

    const originalLineWidth = ctx.lineWidth;
    ctx.lineWidth = scaleX > 1 ? scaleX * 2 : 2; 
    
    drawPolygonShapeOnContext(ctx, scaledPoints, 'red', 'rgba(255, 0, 0, 0.3)', true);

    ctx.lineWidth = originalLineWidth;
  });
  
  const link = document.createElement('a');
  link.download = 'image-with-polygons.png';
  link.href = exportCanvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function drawPolygonShapeOnContext(ctx, points, strokeStyle, fillStyle, closePath = true) {
  if (points.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  if (closePath) {
    ctx.closePath();
  }
  ctx.strokeStyle = strokeStyle;
  ctx.stroke();
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
}

onMounted(() => {
  const storedPolygons = localStorage.getItem('polygons');
  const storedImage = localStorage.getItem('uploadedImage');

  if (storedPolygons) {
    polygons.splice(0, polygons.length, ...JSON.parse(storedPolygons));
  }
  if (storedImage) {
    imageUrl.value = storedImage;
  }
});

watch(imageUrl, (newUrl) => {
  if (newUrl) {
    nextTick(() => {
      initializeCanvas();
    });
  }
});
</script>

<style scoped>
.polygon-drawer-container {
  font-family:
    'Inter',
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif,
    'Apple Color Emoji',
    'Segoe UI Emoji',
    'Segoe UI Symbol';
  background-color: hsl(240, 5.9%, 90%);
  color: hsl(240, 10%, 3.9%);
  padding: 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1);
  max-width: 900px;
  margin: 2rem auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: hsl(240, 10%, 3.9%);
  margin-bottom: 0.5rem;
}

.section-subtitle {
  font-size: 1.25rem;
  font-weight: 500;
  color: hsl(240, 10%, 3.9%);
  margin-bottom: 1rem;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.file-input {
  flex-grow: 1;
  padding: 0.5rem;
  border: 1px solid hsl(240, 5.9%, 90%);
  border-radius: 0.5rem;
  background-color: hsl(240, 5.9%, 90%);
  color: hsl(240, 10%, 3.9%);
  cursor: pointer;
}
.file-input:focus {
    outline: 2px solid hsl(222.2, 84.1%, 49.2%);
    outline-offset: 2px;
}

.input-field {
  flex-grow: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid hsl(240, 5.9%, 90%);
  border-radius: 0.5rem;
  background-color: hsl(240, 5.9%, 90%);
  color: hsl(240, 10%, 3.9%);
}
.input-field::placeholder {
  color: hsla(240, 10%, 3.9%, 0.7);
}
.input-field:focus {
  outline: none;
  border-color: hsl(222.2, 84.1%, 49.2%);
  box-shadow: 0 0 0 2px hsla(222.2, 84.1%, 49.2%, 0.2);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.2s,
    border-color 0.2s,
    color 0.2s,
    box-shadow 0.2s;
  white-space: nowrap;
}

.btn-primary {
  background-color: hsl(222.2, 47.4%, 11.2%);
  color: hsl(210, 20%, 98%);
  border: 1px solid hsl(222.2, 47.4%, 11.2%);
}
.btn-primary:hover {
  background-color: hsla(222.2, 47.4%, 11.2%, 0.9);
}

.btn-danger {
  background-color: hsl(0, 84.2%, 60.2%);
  color: hsl(210, 20%, 98%);
  border: 1px solid hsl(0, 84.2%, 60.2%);
}
.btn-danger:hover {
  background-color: hsla(0, 84.2%, 60.2%, 0.9);
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
}

.image-wrapper {
  position: relative;
  display: inline-block;
  border: 1px solid hsl(240, 5.9%, 90%);
  border-radius: 0.5rem;
  overflow: hidden;
}

.uploaded-image {
  display: block;
}

.canvas-overlay {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  pointer-events: auto;
  border: 1px solid #ccc;
  background-color: transparent;
}

.polygons-list-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.polygon-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.polygon-list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: hsl(0, 0%, 100%);
  border: 1px solid hsl(240, 5.9%, 90%);
  border-radius: 0.5rem;
  font-size: 0.9rem;
}

.polygon-name-link {
  cursor: pointer;
  color: hsl(222.2, 47.4%, 11.2%);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}
.polygon-name-link:hover {
  color: hsla(222.2, 47.4%, 11.2%, 0.8);
  text-decoration: underline;
}

.clicked-polygon-info {
  margin-top: 1rem;
  padding: 1rem;
  background-color: hsl(240, 4.8%, 95.9%);
  border: 1px solid hsl(240, 5.9%, 90%);
  border-radius: 0.5rem;
  color: hsl(240, 10%, 3.9%);
}
.info-title {
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
}
.info-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: hsl(222.2, 47.4%, 11.2%);
}
</style>