<?php

namespace Tests\Feature;

use App\Models\Section;
use App\Models\Site;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MoveSectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_section_sorting_down()
    {
        $site = Site::factory()->create();
        $section = Section::factory()->create(['site_id' => $site->id, 'sort' => 1]);
        $section2 = Section::factory()->create(['site_id' => $site->id, 'sort' => 2]);
        $section3 = Section::factory()->create(['site_id' => $site->id, 'sort' => 3]);

        $response = $this->post("/{$site->id}/section/{$section->id}/down");
        $this->assertDatabaseHas('sections', [
            'id' => $section->id,
            'site_id' => $site->id,
            'sort' => 2,
        ]);
        $this->assertDatabaseHas('sections', [
            'id' => $section2->id,
            'site_id' => $site->id,
            'sort' => 1,
        ]);
        $this->assertDatabaseHas('sections', [
            'id' => $section3->id,
            'site_id' => $site->id,
            'sort' => 3,
        ]);
    }

    public function test_section_sorting_up()
    {
        $site = Site::factory()->create();
        $section = Section::factory()->create(['site_id' => $site->id, 'sort' => 1]);
        $section2 = Section::factory()->create(['site_id' => $site->id, 'sort' => 2]);
        $section3 = Section::factory()->create(['site_id' => $site->id, 'sort' => 3]);

        $response = $this->post("/{$site->id}/section/{$section2->id}/up");
        $this->assertDatabaseHas('sections', [
            'id' => $section->id,
            'site_id' => $site->id,
            'sort' => 2,
        ]);
        $this->assertDatabaseHas('sections', [
            'id' => $section2->id,
            'site_id' => $site->id,
            'sort' => 1,
        ]);
        $this->assertDatabaseHas('sections', [
            'id' => $section3->id,
            'site_id' => $site->id,
            'sort' => 3,
        ]);
    }

    public function test_cannot_move_first_section_up()
    {
        $site = Site::factory()->create();
        $section = Section::factory()->create(['site_id' => $site->id, 'sort' => 1]);
        $section2 = Section::factory()->create(['site_id' => $site->id, 'sort' => 2]);

        $response = $this->post("/{$site->id}/section/{$section->id}/up");
        $this->assertDatabaseHas('sections', [
            'id' => $section->id,
            'site_id' => $site->id,
            'sort' => 1,
        ]);
        $this->assertDatabaseHas('sections', [
            'id' => $section2->id,
            'site_id' => $site->id,
            'sort' => 2,
        ]);
    }

    public function test_cannot_move_last_section_down()
    {
        $site = Site::factory()->create();
        $section = Section::factory()->create(['site_id' => $site->id, 'sort' => 1]);
        $section2 = Section::factory()->create(['site_id' => $site->id, 'sort' => 2]);

        $response = $this->post("/{$site->id}/section/{$section2->id}/down");
        $this->assertDatabaseHas('sections', [
            'id' => $section->id,
            'site_id' => $site->id,
            'sort' => 1,
        ]);
        $this->assertDatabaseHas('sections', [
            'id' => $section2->id,
            'site_id' => $site->id,
            'sort' => 2,
        ]);
    }
}
