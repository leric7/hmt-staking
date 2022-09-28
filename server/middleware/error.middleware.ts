import { Request, Response, NextFunction } from 'express'

import HttpException from '../common/http-exception'

const errorHandler = (
  err: HttpException,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  const status = err.statusCode || err.status || 500

  res.status(status).send(err)
}

export { errorHandler }
