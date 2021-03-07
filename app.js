const animals = [
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

var vm = new Vue ({
  el: '#app',
  data: {
    animals: animals
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
