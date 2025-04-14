const isLoggedIn = (req, res, next) => {
  if (req.method === 'GET') {
    if (req.session.user) {
      next();
    } else {
      const redirect = req.originalUrl;
      res.redirect(`/login?redirect=${encodeURIComponent(redirect)}`);
    }
  } else {
    next();
  }
};
module.exports = {
  isLoggedIn,
};
