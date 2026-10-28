import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './store';

// גרסאות מוקלדות של ה-hooks של Redux, כדי לא לכתוב טיפוסים בכל שימוש
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
