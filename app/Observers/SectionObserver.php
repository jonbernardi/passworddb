<?php

namespace App\Observers;

use App\Models\Section;

class SectionObserver
{
    /**
     * Listen to the Section deleting event.
     *
     * @return void
     */
    public function deleting(Section $section)
    {
        $section->data()->delete();
    }
}
