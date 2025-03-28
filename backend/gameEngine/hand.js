
class Hand {

    constructor(){
        this.cards=[]
    }
    handCard(card){
    
        this.cards.push(card)
    }

    reveal(){
        for(const card of this.cards){
            card.setFaceUp()
        }
    }
    
    size(){
        return this.cards.length
    }

    evaluate(){

        let sum=0
        this.cards.forEach(card => {

            sum+=card.value
        })

        if(sum > 21){

           for (const card of this.cards){

                if(card.isAce()){
                    sum-=card.value
                    sum+=1
                    if(sum <= 21){
                        break
                    }
                }
           }
            
        }
        return sum

    }

    evaluateDealer(){
            
            let sum=0
            this.cards.forEach(card => {
    
                if(card.isVisible()){
                    sum+=card.value
                }
            })
    
            if(sum > 21){
    
            for (const card of this.cards){
    
                    if(card.isAce()){
                        sum-=card.value
                        sum+=1
                        if(sum <= 21){
                            break
                        }
                    }
            }
                
            }
            return sum
    }

    clear(){ 

        this.cards=[]
    }

    toJSON(){

        const cards=[]
        for(const card of this.cards){

            cards.push(card.toJSON())
        }

        const res={}

        res['cards']=cards
        res['count']=this.evaluate()

        return res
    }

    toJSONProd(){

        const cards=[]
        for(const card of this.cards){

            cards.push(card.toJSON())
        }

        const res={}

        res['cards']=cards
        res['count']=this.evaluateDealer()
        return res
    }

    


}

module.exports = {

    Hand
}
