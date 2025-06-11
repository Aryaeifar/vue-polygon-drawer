import VuePolygonDrawer from './VuePolygonDrawer.vue';
export default {
  install: (app) => {
    app.component('VuePolygonDrawer', VuePolygonDrawer);
  },
};

export { VuePolygonDrawer };