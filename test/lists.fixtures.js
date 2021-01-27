
function makeListsArray() {
    return [
      {
        id: 1,
        name: 'Weekend Activities',
        user_id: 2,
        theme: 'ColorB'
      },
      {
        id: 2,
        name: 'Music',
        user_id: 1,
        theme: 'ColorD'
      },
      {
        id: 3,
        name: 'Home Decor',
        user_id: 3,
        theme: 'ColorA'
      },
      {
        id: 4,
        name: 'Random Thoughts',
        user_id: 1,
        theme: 'ColorC'
      },
    ];
  }

  function makeMaliciousList() {
    const maliciousList = {
      id: 911,
      theme: 'ColorA',
      name: `Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt; Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
    }
    const expectedList = {
      ...maliciousList,
      name: `Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt; Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
    }
    return {
      maliciousList,
      expectedList,
    }
  }
  
  module.exports = {
    makeListsArray,
    makeMaliciousList
  }