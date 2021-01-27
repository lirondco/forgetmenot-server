
function makeIdeasArray() {
    return [
        {
            id: 1,
            name: 'Paragliding',
            content: 'blacks beach san diego',
            posted_date: '2029-01-22T16:28:32.615Z',
            list_id: 1,
            user_id: 2
        },
        {
            id: 2,
            name: 'Fireworks',
            content: 'katy perry sang at inauguration',
            posted_date: '2029-01-22T16:28:32.615Z',
            list_id: 2,
            user_id: 1
        },
        {
            id: 3,
            name: 'russian carpet',
            content: 'found russian carpet at the antique store, fits the front room well',
            posted_date: '2029-01-22T16:28:32.615Z',
            list_id: 3,
            user_id: 3
        },
        {
            id: 4,
            name: 'knitting sounds good',
            content: 'just randomly thought of picking up knitting as a hobby',
            posted_date: '2029-01-22T16:28:32.615Z',
            list_id: 4,
            user_id: 1
        },

    ]
  }

  function makeMaliciousIdea() {
    const maliciousIdea = {
      id: 911,
      name: 'Naughty naughty very naughty <script>alert("xss");</script>',
      content: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
      list_id: 1,
      user_id: 1,
      posted_date: new Date().toISOString()
    }
    const expectedIdea = {
      ...maliciousIdea,
      name: 'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;',
      content: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
    }
    return {
      maliciousIdea,
      expectedIdea,
    }
  }
  
  module.exports = {
    makeIdeasArray,
    makeMaliciousIdea
  }