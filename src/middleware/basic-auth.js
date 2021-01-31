const AuthService = require('../auth/auth-service')

function requireAuth(req, res, next) {
    const authToken = req.get('Authorization') || ''

    let bearerToken
    if (authToken.toLowerCase().startsWith('bearer ')) {
        bearerToken = authToken.slice(7, authToken.length)
    } else {
        return res.status(401).json({ error: 'Unauthorised request' })
    }

    const [tokenUserName, tokenPassword] = AuthService.parseBasicToken(bearerToken)

    if (!tokenUserName || !tokenPassword) {
        return res.status(401).json({ error: 'Unauthorised request' })
    }
    
    AuthService.getUserWithUserName(
        req.app.get('db'),
        tokenUserName
    )
        .then(user => {
            if (!user) return res.status(401).json({ error: 'Unauthorised request' })

            return AuthService.comparePasswords(tokenPassword, user.password)
                .then(hasMatch => {
                    if(hasMatch) {
                        req.user = user
                        next()
                    } else {
                        return res.status(401).json({ error: 'Unauthorised request' })
                    }
                })
        })
        .catch(err => {
            console.error(err)
            next(err)
        })
}

function requireAdmin(req, res, next) {
    if (req.user.username !== 'admin1') {
      return res.status(401).json({ error: 'Unauthorized request' })
    }
  
    return next()
  }
  
  module.exports = {
    requireAuth,
    requireAdmin,
  }