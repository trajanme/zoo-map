var animals = [
  {
    name: 'アフリカゾウ',
    type: '長鼻目ゾウ科アフリカゾウ属',
    english: 'African Elephant',
    quantity: 3,
    weight: 6000,
  },
  {
    name: 'ニホンザル',
    type: '哺乳綱霊長目オナガザル科マカク属',
    english: 'Japanese Macaque',
    quantity: 30,
    weight: 11,
  }
]
var zooName = '八木山動物公園'

var vm = new Vue ({
  el: '#app',
  data: {
    zooName: zooName,
    animals: animals
  },
  computed: {
    totalQuantity: function() {
      return this.animals.reduce(function(sum, animal) {
        return sum + animal.quantity
      }, 0)
    },
    errorMessageStyle: function () {
      return {
        border: this.over50Animals ? '1px solid red' : '',
        color: this.over50Animals ? 'red' : ''
      }
    },
    over50Animals: function() {
      return this.totalQuantity > 50
    },
  },
  filters: {
    numberWithDelimiter: function(value) {
      if (!value) {
        return '0'
      }
      return value.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1,')
    }
  }
})

window.vm = vm
