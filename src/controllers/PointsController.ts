import knex from '../database/connection'
import { Request, Response } from 'express'

class PointsController {

  async index(request: Request, response: Response) {
    const {city, uf, items} = request.query

    const parsedItems = String(items)
      .split(',')
      .map(item => Number(item.trim()))

    const points = await knex('points')
      .join('point_items', 'points.id', '=', 'point_items.point_id')
      .whereIn('point_items.item_id', parsedItems)
      .where('city', String(city))
      .where('uf', String(uf))
      .distinct()
      .select('points.*')

    return response.json(points)

  }
  async showPoint(request: Request, response: Response): Promise<{}> {
    const { id } = request.params

    const point = await knex('points').where('id', id).first()

    if (!point) {
      return response.status(400).json({message: 'Point not found'})
    }

    /**
      * SELECT * FROM items
      *  JOIN point_items ON items.id = point_items.item_id
      *  WHERE point_items.point_id = {id}
      * Finish
      */
    const items = await knex('items').
      join('point_items', 'items.id', '=', 'point_items.item_id')
      .where('point_items.point_id', id)
      .select('items.title')

    return response.json({point, items})
  }
  async createPoint(request: Request, response : Response): Promise<{}> {
    //Desestruturação
    const {
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
      items
    } = request.body
  
    const trx = await knex.transaction()

    const point = {
      image: 'https://img.freepik.com/vetores-gratis/trabalhador-de-coleta-de-lixo-limpando-a-lixeira-no-caminhao-homem-carregando-lixo-em-ilustracao-vetorial-plana-de-saco-plastico-servico-municipal-conceito-de-eliminacao-de-residuos_74855-10181.jpg?w=996&t=st=1664944296~exp=1664944896~hmac=c34571e6ab3373fecfdda14586a3f0f6c4d3e788ae6bae3c9064f97f3db09704',
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
    }
  
    const insertedIds = await  trx('points').insert(point)
  
    const point_id = insertedIds[0]
  
    const pointsItems = items.map( (item_id: number) => {
      return {
        item_id,
        point_id,
      }
    })
  
    await trx('point_items').insert(pointsItems)

    await trx.commit()
  
    return response.json({ 
      id: point_id,
      ...point,
    })
  }
}

export default PointsController