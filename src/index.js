const VLazyImageComponent = {
  props: {
    src: {
      type: String,
      required: true,
    },
    srcPlaceholder: {
      type: String,
      default: "data:,",
    },
    errorSrc: {
      type: String,
      default: "",
    },
    retryTimes: {
      type: Number,
      default: 0,
    },
    srcset: {
      type: String,
    },
    intersectionOptions: {
      type: Object,
      default: () => ({}),
    },
    usePicture: {
      type: Boolean,
      default: false,
    },
  },
  inheritAttrs: false,
  data: () => ({ observer: null, intersected: false, loaded: false }),
  computed: {
    srcImage() {
      return this.intersected && this.src ? this.src : this.srcPlaceholder;
    },
    srcsetImage() {
      return this.intersected && this.srcset ? this.srcset : false;
    },
  },
  methods: {
    load() {
      if (this.$el.getAttribute("src") !== this.srcPlaceholder) {
        this.loaded = true;
        this.$emit("load", this.$el);
      }
    },
    error() {
      const searchSplitArr = this.$el.src.split("?");
      if (searchSplitArr.length > 2) {
        this.emitError();
      } else {
        const queryArray = searchSplitArr[1] ? searchSplitArr[1].split("&") : [];
        let queryObj = {};
        queryArray.forEach((i) => {
          const _l = i.split("=");
          if (_l.length === 2) {
            queryObj[_l[0]] = _l[1];
          }
        });
        if (this.retryTimes) {
          const _retryTimes = queryObj._retryTimes ? parseInt(queryObj._retryTimes) : 0;
          if (_retryTimes < this.retryTimes) {
            queryObj._retryTimes = _retryTimes + 1;
            queryObj._retryErrorStamp = Date.now();
            let _srcQueryArr = [];
            for(let key in queryObj) {
              _srcQueryArr.push(`${key}=${queryObj[key]}`);
            }
            this.$el.src = `${searchSplitArr[0]}?${_srcQueryArr.join('&')}`;
          } else {
            this.emitError();
          }
        } else {
          this.emitError();
        }
      }
    },
    emitError() {
      if (this.errorSrc) {
        this.$el.src = this.errorSrc;
      }
      this.$emit("error", this.$el);
    },
  },
  render(h) {
    let img = h("img", {
      attrs: {
        src: this.srcImage,
        srcset: this.srcsetImage,
      },
      domProps: this.$attrs,
      class: {
        "v-lazy-image": true,
        "v-lazy-image-loaded": this.loaded,
      },
      on: { load: this.load, error: this.error },
    });
    if (this.usePicture) {
      return h("picture", { on: { load: this.load } }, this.intersected ? [this.$slots.default, img] : [img]);
    } else {
      return img;
    }
  },
  mounted() {
    if ("IntersectionObserver" in window) {
      this.observer = new IntersectionObserver((entries) => {
        const image = entries[0];
        if (image.isIntersecting) {
          this.intersected = true;
          this.observer.disconnect();
          this.$emit("intersect");
        }
      }, this.intersectionOptions);
      this.observer.observe(this.$el);
    }
  },
  destroyed() {
    if ("IntersectionObserver" in window) {
      this.observer.disconnect();
    }
  },
};

export default VLazyImageComponent;

export const VLazyImagePlugin = {
  install: (Vue, opts) => {
    Vue.component("VLazyImage", VLazyImageComponent);
  },
};
