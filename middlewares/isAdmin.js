const isAdmin = (req, res, next) => {
  if (req.method === 'GET') {
    if (req.session.user && req.session.user.role === "admin") {
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
  isAdmin,
};
