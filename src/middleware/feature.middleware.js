export const filterMiddleware = (filedName,paramsName)=>{
    return(req,res,next)=>{
        req.Query  =  req.Query.where({[filedName]:req.params[paramsName]})
        next();
    }
}

export const paganationMiddleweare = ()=>{
    return async(req,res,next)=>{
        const {page,limit}=req.query;
        let currentPage = page || 1;
        let perPage = limit || 10;
        const skip = (currentPage-1)*perPage;
        const modelToken = req.Query.model
        const totalRows = await modelToken.countDocuments();
        const noOfPages = Math.ceil(totalRows/perPage);
        req.Query = req.Query.skip(skip).limit(perPage)
        const hasNext = currentPage < noOfPages
        const prevPage = currentPage>1
       const meta={
            hasNext,
            prevPage,
            currentPage,
            noOfPages,
            totalRows,
            limit,
            page:perPage
        } 
        req.meta =meta
        next();
    }
}
export const paganationMiddlewearefilter = (model) => {
  return async (req, res, next) => {
    try {
      let { page = 1, limit = 10 } = req.query;

      page = parseInt(page);
      limit = parseInt(limit);

      const skip = (page - 1) * limit;

      if (!req.queryMongoose) {
        req.queryMongoose = model.find(); 
      }

      req.queryMongoose = req.queryMongoose.skip(skip).limit(limit);

      const totalRows = await model.countDocuments(req.filter || {}); 

      const noOfPages = Math.ceil(totalRows / limit);

      req.meta = {
        totalRows,
        noOfPages,
        currentPage: page,
        perPage: limit,
        hasNext: page < noOfPages,
        hasPrev: page > 1,
      };

      next();
    } catch (err) {
      console.error("Pagination error:", err.message);
      res.status(500).json({ message: " Pagination middleware error" });
    }
  };
}; 
