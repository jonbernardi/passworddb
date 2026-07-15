<?php

namespace Tests\Feature;

use App\Models\Data;
use App\Models\Section;
use App\Models\Site;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeleteRecordTest extends TestCase
{
    use RefreshDatabase;

    public function test_delete_record()
    {
        $site = Site::factory()->create();
        $section = Section::factory()->create(['site_id' => $site->id]);
        $record = Data::factory()->create(['section_id' => $section->id, 'name' => 'recordname', 'data' => []]);
        $response = $this->delete("/{$site->id}/section/{$section->id}/data/{$record->id}");
        $this->assertDatabaseMissing('data', ['id' => $record->id]);
    }
}
