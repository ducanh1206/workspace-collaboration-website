"use client"

import { ListWithCards } from "@/types";
import { List } from "@prisma/client"
import { ListForm } from "./list-form";
import { use, useEffect, useState } from "react";
import { ListItem } from "./list-item";
import { DragDropContext, Droppable } from "@hello-pangea/dnd"
import { useAction } from "@/hooks/use-action";
import { updateListOrder } from "@/actions/update-list-order";
import { updateCardOrder } from "@/actions/update-card-order";
import { toast } from "sonner";
import { error } from "console";

interface ListContainerProps {
    data: ListWithCards[];
    boardId: string;
}

function reorder<T>(list: T[], startIndex: number, endIndex: number) {
    const result = Array.from(list)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)
    return result
}

export const ListContainer = ({
    data,
    boardId
}: ListContainerProps) => {
    const [orderedData, setorderedData] = useState(data)

    const { execute: executeUpdateListOrder } = useAction(updateListOrder, {
        onSuccess: () => {
            toast.success("List reordered!")
        },
        onError: (error) => {
            toast.error(error)
        }
    })

    const { execute: executeUpdateCardOrder } = useAction(updateCardOrder, {
        onSuccess: () => {
            toast.success("Card reordered!")
        },
        onError: (error) => {
            toast.error(error)
        }
    })

    useEffect(() => {
        setorderedData(data)
    }, [data])

    const onDragEnd = ( result: any ) => {
        const { destination, source, type } = result

        if(!destination) {
            return
        }

        // in case dropped in the same position
        if(destination.droppableId === source.droppableId && destination.index === source.index) {
            return
        }

        // in case user move a list
        if(type === "list") {
            const items = reorder(
                orderedData,
                source.index,
                destination.index,
            ).map((item, index) => ({...item, order: index}))

            setorderedData(items)
            // TODO: Trigger Server Action
            executeUpdateListOrder({ items, boardId })
        }

        // in case user move a card
        if(type === "card") {
            let newOrderData = [...orderedData]

            // get the source and destination list
            const sourceList = newOrderData.find(list => list.id === source.droppableId)
            const destList = newOrderData.find(list => list.id === destination.droppableId)
            
            if(!sourceList || !destList) {
                return
            }

            // check if cards exists on the sourceList
            if (!sourceList.cards) {
                sourceList.cards = []
            }

            // check if cards exists on the destList
            if (!destList.cards) {
                destList.cards = []
            }

            // move cards in the same list
            if(source.droppableId === destination.droppableId) {
                const reorderedCards = reorder(
                    sourceList.cards,
                    source.index,
                    destination.index,
                )
                
                reorderedCards.forEach((card, idx) => {
                    card.order = idx
                })

                sourceList.cards = reorderedCards

                setorderedData(newOrderData)
                // TODO: Trigger Server Action
                executeUpdateCardOrder({
                    boardId: boardId,
                    items: reorderedCards,
                })
                // user move the cards to another list

            } else {
                // remove card from the source list
                const [movedCard] = sourceList.cards.splice(source.index, 1)

                // assign the new listId to the moved card
                movedCard.listId = destination.droppableId

                // add card to the destination list
                destList.cards.splice(destination.index, 0, movedCard)

                sourceList.cards.forEach((card, idx) => {
                    card.order = idx
                })

                // update the order for each card in the destination list
                destList.cards.forEach((card, idx) => {
                    card.order = idx
                })

                setorderedData(newOrderData)
                //TODO: Trigger Server Action
                executeUpdateCardOrder({
                    boardId: boardId,
                    items: destList.cards,
                })
            }
        }
    }

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="lists" type="list" direction="horizontal">
                {(provided) => (
                    <ol 
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="flex gap-x-3 h-full"
                    >
                        {orderedData.map((list, index) => {
                            return (
                                <ListItem
                                    key={list.id}
                                    index={index}
                                    data={list}    
                                />
                            )
                        })}
                        {provided.placeholder}
                        <ListForm />
                        <div className="flex-shrink-0 w-1"/>
                    </ol>
                )}
            </Droppable>
        </DragDropContext>
    )
}