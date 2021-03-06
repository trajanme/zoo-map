const animals = [
  {
    name: 'アフリカゾウ',
    type: '長鼻目ゾウ科アフリカゾウ属'
  },
  {
    name: 'ニホンザル',
    type: '哺乳綱霊長目オナガザル科マカク属'
  }
]

var vm = new Vue ({
  el: '#app',
  data: {
    animals: animals
  }
})

window.vm = vm
