/**
* Created by OXOYO on 2019/5/27.
*
* SignaturePad
*/

<style scoped lang="less" rel="stylesheet/less">
  .pad-box {
    width: 100%;
    height: 100%;
    display: inline-block;

    .pad-canvas {
      width: 100%;
      height: 100%;
    }
  }
</style>

<template>
  <div class="pad-box">
    <canvas class="pad-canvas" ref="padCanvas"></canvas>
  </div>
</template>

<script>
  import { mapGetters } from 'vuex'

  // import SignaturePad from 'signature_pad'
  import SignaturePad from '@/global/lib/signature_pad.js'

  // Erase
  SignaturePad.prototype.eraser = function () {
    this._ctx.globalCompositeOperation = 'destination-out'
  }
  // painting
  SignaturePad.prototype.draw = function () {
    this._ctx.globalCompositeOperation = 'source-over'
  }

  export default {
    name: 'SignaturePad',
    props: {
      saveType: {
        type: String,
        default: 'image/png'
      },
      options: {
        type: Object,
        default: () => {}
      },
      images: {
        type: Array,
        default: () => []
      }
    },
    data () {
      return {
        signaturePad: {},
        cacheImages: [],
        signatureData: '',
        onResizeHandler: null,
        // default allocation
        defOptions: {
          dotSize: 1,
          minWidth: 1 * 0.3,
          maxWidth: 1 * 1.7,
          throttle: 16,
          minDistance: 5,
          backgroundColor: 'rgba(0, 0, 0, 0)',
          penColor: 'black',
          velocityFilterWeight: 0.7,
          onBegin: () => {},
          onEnd: () => {}
        },
        // Transparent picture
        transparentPng: {
          src:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
          x: 0,
          y: 0
        },
        // Picture type
        imageTypes: ['image/png', 'image/jpeg', 'image/svg+xml']
      }
    },
    computed: {
      ...mapGetters([
        'activeBoardIndex',
        'boardList'
      ]),
      undoHistory () {
        let _t = this
        return _t.boardList[_t.activeBoardIndex].signaturePad.undoHistory
      }
    },
    watch: {
      activeBoardIndex (newVal, oldVal) {
        let _t = this
        _t.handlePad(newVal, oldVal)
      }
    },
    methods: {
      setOption (key, val) {
        let _t = this
        if (_t.signaturePad && key) {
          _t.signaturePad[key] = val
          // Update padOption
          _t.$store.commit('board/signaturePad/options/update', {
            index: _t.activeBoardIndex,
            data: {
              key,
              val
            }
          })
        }
      },
      resizeCanvas () {
        let _t = this
        const canvas = _t.$refs.padCanvas
        const data = _t.signaturePad.toData()
        const ratio = Math.max(window.devicePixelRatio || 1, 1)
        canvas.width = canvas.offsetWidth * ratio
        canvas.height = canvas.offsetHeight * ratio
        canvas.getContext('2d').scale(ratio, ratio)
        _t.signaturePad.clear()
        _t.signatureData = _t.transparentPng
        _t.signaturePad.fromData(data)
      },
      // save
      save () {
        let _t = this
        if (!_t.imageTypes.includes(_t.saveType)) {
          throw new Error('Image type is incorrect!')
        }

        if (_t.signaturePad.isEmpty()) {
          return {
            isEmpty: true,
            data: null
          }
        } else {
          _t.signatureData = _t.signaturePad.toDataURL(_t.saveType)
          return {
            isEmpty: false,
            data: _t.signatureData
          }
        }
      },
      // Undo
      undo () {
        let _t = this
        let data = _t.signaturePad.toData()
        let last = data.pop()
        if (last) {
          _t.$store.commit('board/signaturePad/undoHistory/update', {
            index: _t.activeBoardIndex,
            data: [
              ..._t.undoHistory,
              last
            ]
          })
          return _t.signaturePad.fromData(data)
        }
      },
      // redo
      redo () {
        let _t = this
        let data = _t.signaturePad.toData()
        let last = _t.undoHistory.pop()
        _t.$store.commit('board/signaturePad/undoHistory/update', {
          index: _t.activeBoardIndex,
          data: _t.undoHistory
        })
        if (last) {
          return _t.signaturePad.fromData([
            ...data,
            last
          ])
        }
      },
      // Return the signed image as an array of point groups
      toData () {
        return this.signaturePad.toData()
      },
      // Draw signature image from point group array
      fromData (data) {
        return this.signaturePad.fromData(data)
      },
      // Return the signed image as DataURL
      toDataURL (type) {
        return this.signaturePad.toDataURL(type)
      },
      // Draw signature image from DataURL
      fromDataURL (data) {
        return this.signaturePad.fromDataURL(data)
      },
      // draw
      draw () {
        this.signaturePad.draw()
      },
      // Clear canvas
      clear () {
        this.signaturePad.clear()
      },
      // Erase
      eraser () {
        this.signaturePad.eraser()
      },
      // Unbind all event handlers
      off () {
        return this.signaturePad.off()
      },
      // Rebind all event handlers
      on () {
        return this.signaturePad.on()
      },
      // True if the canvas is empty, false otherwise
      isEmpty () {
        return this.signaturePad.isEmpty()
      },
      handleOnBegin () {
        let _t = this
        // Clear undo history
        _t.$store.commit('board/signaturePad/undoHistory/update', {
          index: _t.activeBoardIndex,
          data: []
        })
      },
      handlePad (newVal, oldVal) {
        let _t = this
        // Update old artboard
        if (_t.boardList[oldVal]) {
          _t.$store.commit('board/signaturePad/data/update', {
            index: oldVal,
            data: _t.toData()
          })
        }
        // Update the current artboard
        if (_t.boardList[newVal]) {
          // update options
          let padOptions = _t.boardList[newVal].signaturePad.options
          let keys = Object.keys(padOptions)
          for (let i = 0, len = keys.length; i < len; i++) {
            let key = keys[i]
            let val = padOptions[key]
            _t.setOption(key, val)
          }
          // Clear canvas
          _t.clear()
          _t.fromData(_t.boardList[newVal].signaturePad.data)
        }
      }
    },
    mounted () {
      let _t = this
      let canvas = _t.$refs.padCanvas
      // Create an artboard instance
      _t.signaturePad = new SignaturePad(canvas, {
        ..._t.defOptions,
        ..._t.options,
        onBegin: _t.handleOnBegin
      })

      // Bind resize event
      _t.onResizeHandler = _t.resizeCanvas.bind(_t)
      window.addEventListener('resize', _t.onResizeHandler, false)
      // Trigger resize event
      _t.resizeCanvas()
      // Monitor events
      _t.$X.utils.bus.$on('board/list/remove', function () {
        _t.handlePad(0)
      })
    },
    beforeDestroy () {
      let _t = this
      // Untie resize event
      if (_t.onResizeHandler) {
        window.removeEventListener('resize', _t.onResizeHandler, false)
      }
    }
  }
</script>
