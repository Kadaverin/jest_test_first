import CartParser from './CartParser';
import uuid from 'uuid'

const FAKED_ID = 'id'

jest.mock('uuid')
uuid.v4.mockImplementation( () => FAKED_ID )

let parser;

beforeEach(() => {
    parser = new CartParser();
});

describe("CartParser - unit tests", () => {

    describe('parseLine' , () => {
        it('should return correct item object' , () => {
            let csvLine = 'Mollis consequat,9.00,2'
            let res = parser.parseLine(csvLine)
            expect(res).toEqual(
                {
                    "name": "Mollis consequat",
                    "price": 9,
                    "quantity": 2,
                    "id": FAKED_ID
                }
            );
        })
    })

    describe('parse' , () => {
        it('should throw "Validation failed!" error when contents is incorrect', () => {
            parser.readFile = () => ''
            parser.validate = jest.fn( () => ['error' , 'another one'])
            expect( parser.parse.bind(parser) ).toThrow('Validation failed!')
        })

        it('should call readFile, validate, parseLine and calcTotal when contents is correct' , () => {
            parser.readFile = jest.fn( () => "Product name,Price,Quantity \n Tvoluptatem,10.32,1")
            parser.validate = jest.fn( () => [] )
            parser.parseLine = jest.fn()
            parser.calcTotal = jest.fn( () => 1)
            
            parser.parse('whatever')

            expect(parser.readFile).toHaveBeenCalledTimes(1)
            expect(parser.validate ).toHaveBeenCalledTimes(1)
            expect(parser.parseLine).toHaveBeenCalledTimes(1)
            expect(parser.calcTotal).toHaveBeenCalledTimes(1)
        })
        
    })

    describe('validate(contents)', () => {
        it('should return empy array when contents is correct', () => {
            let contents =  "Product name,Price,Quantity \n Mollis consequat,9.00,2"
            expect(parser.validate(contents)).toEqual([])
        })

        it('should return not empy array when contents is incorrect' , () => {
            expect(parser.validate(' ')).not.toBe(0)
            expect(parser.validate('ololo')).not.toBe(0)
            expect(parser.validate('this is bad')).not.toBe(0)
            expect(parser.validate('and this is bad too')).not.toBe(0)
            expect(parser.validate('123c 1')).not.toBe(0)
            expect(parser.validate('Product name,Price,Quantity \n Mollis ')).not.toBe(0)
            expect(parser.validate('and so one \n Mollis ')).not.toBe(0)
        })

        it('should call createError when contents is incorect' , () => {
            let contents = 'this is bad'
            parser.createError = jest.fn()

            parser.validate(contents)
            expect(parser.createError).toHaveBeenCalledTimes(3)
        })


        it('should return array with "header" error when content header is incorect' , () => {
             let res = parser.validate('this is bad')
             expect(res).toEqual( [
                    {
                        "column": 0, 
                        "message": "Expected header to be named \"Product name\" but received this is bad.", 
                        "row": 0, 
                        "type": "header"
                    }, 
                    {
                        "column": 1, 
                        "message": "Expected header to be named \"Price\" but received undefined.", 
                        "row": 0, 
                        "type": "header"
                    }, 
                    {
                        "column": 2, 
                        "message": "Expected header to be named \"Quantity\" but received undefined.", 
                        "row": 0, 
                        "type": "header"
                    }
             ])
        })


        it("should return array with 'row' error when content's row is incorect" , () => {
             let contents = "Product name,Price,Quantity \n consequat,9.00"

             let res = parser.validate(contents)

             expect(res).toEqual([
                {
                   "column": -1, 
                   "message": "Expected row to have 3 cells but received 2.",
                   "row": 1, 
                   "type": parser.ErrorType.ROW
                }
             ])
        })

        it('should return array with two errors when second and third cell are not a positive numbers' , () => {
             let contents = "Product name,Price,Quantity \n Mollis consequat, '-34 in sting' , '' "
             let res = parser.validate(contents)

             expect(res).toEqual([    
                 {
                    "column": 1,
                    "message": "Expected cell to be a positive number but received \"'-34 in sting'\".",
                    "row": 1,
                    "type": "cell",
                  },
                  {
                    "column": 2,
                    "message": "Expected cell to be a positive number but received \"''\".",
                    "row": 1,
                    "type": "cell",
                  },
             ])
        })

        it('should return array with one error object when first cell is not string' , () => {
             let res = parser.validate("Product name,Price,Quantity \n ,9.00, 0.3 ")

             expect(res).toEqual([
                 {
                   "column": 0,
                   "message": "Expected cell to be a nonempty string but received \"\".",
                   "row": 1, 
                   "type": parser.ErrorType.CELL
                 }
             ])
        })
    })

    describe('calcTotal' , () => {
        it('should return total price of all items array', () => {
            let items = [ 
                {
                    price: 1,
                    quantity: 4
                 },
                 {
                     price: 10,
                     quantity: 2
                 },
                 {
                     price: 3,
                     quantity: 2
                 }
           ]

           expect(parser.calcTotal(items)).toBe(30)
        })
    })
});


describe("CartParser - integration tests", () => {
    // Add your integration tests here.
    it('should parse .csv file with products and return JSON object with products items and total price', () => {
         let path = __dirname + '/../samples/cart.csv'
         let result = parser.parse(path)
         
         expect(result).toEqual(
           { items: 
                [ 
                    { 
                        name: 'Mollis consequat', 
                        price: 9, 
                        quantity: 2, 
                        id: FAKED_ID 
                    },
                    { 
                        name: 'Tvoluptatem', 
                        price: 10.32, 
                        quantity: 1, 
                        id: FAKED_ID 
                    },
                    { 
                        name: 'Scelerisque lacinia',
                        price: 18.9,
                        quantity: 1,
                        id: FAKED_ID 
                    },
                    { 
                        name: 'Consectetur adipiscing',
                        price: 28.72,
                        quantity: 10,
                        id: FAKED_ID 
                    },
                    { 
                        name: 'Condimentum aliquet',
                        price: 13.9,
                        quantity: 1,
                        id: FAKED_ID } 
                ],
            total: 348.32
          }
        )
    })
});