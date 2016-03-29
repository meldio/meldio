const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);
export default wrap;
