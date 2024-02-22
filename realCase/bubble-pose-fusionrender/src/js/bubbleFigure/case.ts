import { getScene } from '../cinematography';
import {createBubbleFigure} from '../bubbleFigure/index'



export function caseShow() {
    const bubbles = createBubbleFigure();
    getScene().add(bubbles);
}
