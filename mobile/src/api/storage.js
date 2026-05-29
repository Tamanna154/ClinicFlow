const store = new Map();

export default {
  save(key, value) {
    store.set(key, value);
  },
  get(key) {
    return store.get(key);
  },
  remove(key) {
    store.delete(key);
  },
};
