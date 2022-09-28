import { Request, Response, NextFunction } from 'express'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const notFoundHandler = (_req: Request, res: Response, _next: NextFunction) => {
  const message = 'Resource not found'

  res.status(404).send(message)
}

export { notFoundHandler }
