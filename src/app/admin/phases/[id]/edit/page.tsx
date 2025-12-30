'use client';

import { useParams } from 'next/navigation';
import PhaseForm from '@/components/PhaseForm';

export default function EditPhasePage() {
    const params = useParams();
    const id = params.id as string;

    return <PhaseForm id={id} />;
}
