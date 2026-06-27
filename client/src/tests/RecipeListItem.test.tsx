import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import RecipeListItem from '../components/RecipeListItem';
import type { RecipeSearchListItem } from '../services/recipeSearchService';

const baseRecipe: RecipeSearchListItem = {
  recipeId: '11111',
  title: 'Creamy Pesto Pasta',
  cookpadUrl: 'https://cookpad.com/recipe-1',
  imageUrl: 'https://images.example.com/pasta.jpg',
  description: 'A quick pasta dinner with pesto and cream.',
};

const renderBringWidget = vi.fn();

describe('RecipeListItem', () => {
  beforeEach(() => {
    renderBringWidget.mockReset();
    window.bringwidgets = {
      import: {
        render: renderBringWidget,
      },
    };
  });

  it('GivenRecipeListItemData_WhenRenderingComponent_ThenRendersArticleWithTitleHeading', () => {
    // Arrange

    // Act
    render(<RecipeListItem recipe={baseRecipe} onViewDetails={vi.fn()} />);

    // Assert
    expect(screen.getByRole('article')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Creamy Pesto Pasta' }),
    ).toBeInTheDocument();
  });

  it('GivenRecipeWithImage_WhenRenderingComponent_ThenRendersThumbnailWithDescriptiveAltText', () => {
    // Arrange

    // Act
    render(<RecipeListItem recipe={baseRecipe} onViewDetails={vi.fn()} />);

    const image = screen.getByRole('img', { name: 'Creamy Pesto Pasta' });

    // Assert
    expect(image).toHaveAttribute(
      'src',
      'https://images.example.com/pasta.jpg',
    );
  });

  it('GivenRecipeWithoutImage_WhenRenderingComponent_ThenDoesNotRenderImageElement', () => {
    // Arrange
    const noImageRecipe: RecipeSearchListItem = {
      ...baseRecipe,
      imageUrl: null,
    };

    // Act
    render(<RecipeListItem recipe={noImageRecipe} onViewDetails={vi.fn()} />);

    // Assert
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('GivenRecipeWithShortDescription_WhenRenderingComponent_ThenRendersDescriptionPreview', () => {
    // Arrange

    // Act
    render(<RecipeListItem recipe={baseRecipe} onViewDetails={vi.fn()} />);

    // Assert
    expect(
      screen.getByText('A quick pasta dinner with pesto and cream.'),
    ).toBeInTheDocument();
  });

  it('GivenRecipeWithLongDescription_WhenRenderingComponent_ThenTruncatesPreviewWithEllipsis', () => {
    // Arrange
    const longDescription = 'a'.repeat(200);
    const longRecipe: RecipeSearchListItem = {
      ...baseRecipe,
      description: longDescription,
    };

    // Act
    render(<RecipeListItem recipe={longRecipe} onViewDetails={vi.fn()} />);

    expect(screen.queryByText(longDescription)).not.toBeInTheDocument();

    const preview = screen.getByText(/^a+\u2026$/);

    // Assert
    expect(preview.textContent!.length).toBeLessThan(longDescription.length);
  });

  it('GivenRecipeWithoutDescription_WhenRenderingComponent_ThenShowsDescriptionFallbackText', () => {
    // Arrange
    const noDescRecipe: RecipeSearchListItem = {
      ...baseRecipe,
      description: null,
    };

    // Act
    render(<RecipeListItem recipe={noDescRecipe} onViewDetails={vi.fn()} />);

    // Assert
    expect(screen.getByText('Description coming soon.')).toBeInTheDocument();
  });

  it('GivenRecipeListItemData_WhenRenderingComponent_ThenRendersViewDetailsButton', () => {
    // Arrange

    // Act
    render(<RecipeListItem recipe={baseRecipe} onViewDetails={vi.fn()} />);

    // Assert
    expect(
      screen.getByRole('button', { name: 'View details' }),
    ).toBeInTheDocument();
  });

  it('GivenRenderedRecipeActions_WhenInspectingStyles_ThenUsesLiveBringButtonStyling', () => {
    // Arrange

    // Act
    render(<RecipeListItem recipe={baseRecipe} onViewDetails={vi.fn()} />);

    const article = screen.getByRole('article');
    const viewDetailsButton = screen.getByRole('button', {
      name: 'View details',
    });
    const bringLink = screen.getByRole('link', { name: 'Import to Bring!' });

    // Assert
    expect(getComputedStyle(article).backgroundColor).toBe(
      'rgba(255, 255, 255, 0.94)',
    );
    expect(getComputedStyle(viewDetailsButton).backgroundColor).toBe(
      'rgb(248, 248, 248)',
    );
    expect(getComputedStyle(viewDetailsButton).color).toBe('rgb(37, 48, 54)');
    expect(getComputedStyle(viewDetailsButton).border).toBe(
      '1px solid rgba(151, 151, 151, 0.1)',
    );
    expect(getComputedStyle(viewDetailsButton).borderRadius).toBe('4px');
    expect(getComputedStyle(viewDetailsButton).boxShadow).toBe(
      '0px 2px 2px 0px rgba(0, 0, 0, 0.2)',
    );

    expect(getComputedStyle(bringLink).backgroundColor).toBe(
      'rgb(248, 248, 248)',
    );
    expect(getComputedStyle(bringLink).color).toBe('rgb(37, 48, 54)');
    expect(getComputedStyle(bringLink).border).toBe(
      '1px solid rgba(151, 151, 151, 0.1)',
    );
    expect(getComputedStyle(bringLink).borderRadius).toBe('4px');
    expect(getComputedStyle(bringLink).boxShadow).toBe(
      '0px 2px 2px 0px rgba(0, 0, 0, 0.2)',
    );
  });

  it('GivenViewDetailsHandler_WhenViewDetailsButtonIsActivated_ThenCallsOnViewDetails', async () => {
    // Arrange
    const user = userEvent.setup();
    const onViewDetails = vi.fn();

    // Act
    render(
      <RecipeListItem recipe={baseRecipe} onViewDetails={onViewDetails} />,
    );

    await user.click(screen.getByRole('button', { name: 'View details' }));

    // Assert
    expect(onViewDetails).toHaveBeenCalledTimes(1);
  });

  it('GivenRecipeWithCookpadUrl_WhenRenderingComponent_ThenShowsImportToBringLink', () => {
    // Arrange

    // Act
    render(<RecipeListItem recipe={baseRecipe} onViewDetails={vi.fn()} />);

    const bringLink = screen.getByRole('link', { name: 'Import to Bring!' });

    // Assert
    expect(bringLink).toHaveAttribute(
      'href',
      'https://www.getbring.com/en/home',
    );
    expect(bringLink).toHaveAttribute('target', '_blank');
    expect(bringLink).toHaveAttribute('rel', 'noreferrer');
  });

  it('GivenRecipeWithoutCookpadUrl_WhenRenderingComponent_ThenDoesNotRenderImportToBringLink', () => {
    // Arrange
    const noUrlRecipe: RecipeSearchListItem = { ...baseRecipe, cookpadUrl: '' };

    // Act
    render(<RecipeListItem recipe={noUrlRecipe} onViewDetails={vi.fn()} />);

    // Assert
    expect(
      screen.queryByRole('link', { name: 'Import to Bring!' }),
    ).not.toBeInTheDocument();
    expect(renderBringWidget).not.toHaveBeenCalled();
  });

  it('GivenBringWidgetIsAvailable_WhenRenderingComponent_ThenRendersBringWidgetWithRecipeUrlAndEnglishConfig', () => {
    // Arrange

    // Act
    render(<RecipeListItem recipe={baseRecipe} onViewDetails={vi.fn()} />);

    // Assert
    expect(renderBringWidget).toHaveBeenCalledTimes(1);
    expect(renderBringWidget).toHaveBeenCalledWith(expect.any(HTMLDivElement), {
      url: 'https://cookpad.com/recipe-1',
      language: 'en',
      theme: 'light',
    });
  });

  it('GivenBringWidgetScriptIsUnavailable_WhenRenderingComponent_ThenKeepsFallbackBringLink', () => {
    // Arrange
    window.bringwidgets = undefined;

    // Act
    render(<RecipeListItem recipe={baseRecipe} onViewDetails={vi.fn()} />);

    // Assert
    expect(
      screen.getByRole('link', { name: 'Import to Bring!' }),
    ).toBeInTheDocument();
  });

  it('GivenBringWidgetLoadsAfterInitialRender_WhenScriptLoadEventFires_ThenRendersBringWidget', () => {
    // Arrange
    window.bringwidgets = undefined;
    const bringScript = document.createElement('script');
    bringScript.src = 'https://platform.getbring.com/widgets/import.js';
    document.head.appendChild(bringScript);

    // Act
    render(<RecipeListItem recipe={baseRecipe} onViewDetails={vi.fn()} />);

    expect(renderBringWidget).not.toHaveBeenCalled();

    window.bringwidgets = { import: { render: renderBringWidget } };
    bringScript.dispatchEvent(new Event('load'));

    // Assert
    expect(renderBringWidget).toHaveBeenCalledTimes(1);
    expect(renderBringWidget).toHaveBeenCalledWith(expect.any(HTMLDivElement), {
      url: 'https://cookpad.com/recipe-1',
      language: 'en',
      theme: 'light',
    });

    bringScript.remove();
  });
});
